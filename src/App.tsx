import React, { useRef, useState } from "react";
import "./App.css";

import styled from "styled-components";
import ReactCardFlip from "react-card-flip";

import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";

import {
	FaCheckCircle,
	FaBrain,
	FaEdit,
	FaSave,
	FaTrash,
} from "react-icons/fa";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { User } from "./Graphics";
import Select from "react-select";

/**
 * done march 20
 * - setup react app
 * - setup firebase app
 * - signin with google
 * - copy paste from skype, split into phrases
 * - tried to do translations
 *
 * Todo March 21
 * -x setup translate api
 * -x store translated word objects in Firebase
 * -x fetch and display all translated word objects
 * -x make a primate "flashcard"
 * -x make a word list when you click a word that word becomes flashcard
 *
 * Next:
 * -x css styling and all that goodnexx
 * ^^ almost did that Mon April 19th :laugh:
 *
 * Next-next:
 * - edit button to fix translations
 * - enter key flips card
 * - <- ^ -> arrow keys move through words
 * - add a lesson date when importing words
 * - mark words as known/unkown
 * - edit words or translations w/ override field
 *
 */

firebase.initializeApp({
	apiKey: "AIzaSyDZiXYsGOIMyNty3EvR2Ji0KhFReenPc1w",
	authDomain: "language-flashcards-40bee.firebaseapp.com",
	projectId: "language-flashcards-40bee",
	storageBucket: "language-flashcards-40bee.appspot.com",
	messagingSenderId: "451270657005",
	appId: "1:451270657005:web:dc384bfc46dbd64f749de4",
	measurementId: "G-6NVZVBM9CF",
});

const auth = firebase.auth();
const firestore = firebase.firestore();

const Flashcard = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	margin: auto;
	height: 180px;
	max-width: 400px;
	border-radius: 6px;
	border: 4px solid blue;
	font-size: 42px;
`;

const FlashcardDiv = styled.div`
	grid-area: flashcard;
	cursor: pointer;
`;

const FlashcardBack = styled(Flashcard)`
	background-color: lightblue;
	position: relative;
`;

// const FlashcardContainer = styled(ReactCardFlip)`
// 	grid-area: flashcard;
// `;

const Header = styled.div`
	display: flex;
	flex-direction: row;
	height: 100px;
	width: auto;
	grid-area: header;
`;

const Title = styled.div`
	font-size: 48px;
	font-family: "Henny Penny";
	font-size: 64px;
	/* margin: auto; */
	flex: 1;
	display: flex;
	justify-content: center;
	align-items: center;
`;

const AddContainer = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	width: 150px;
	justify-content: flex-start;
	align-items: center;
	margin: auto;
`;

const Input = styled.textarea``;

const AddButton = styled.button``;

const PageContainer = styled.div`
	margin: 0px 48px;
	display: grid;
	gap: 1rem;
	grid-template-areas:
		"header header header header header header header"
		". . flashcard flashcard flashcard . ."
		". . actions actions actions . ."
		"phrases phrases phrases phrases phrases phrases phrases";
	grid-template-rows: 120px auto 50px auto;
	grid-template-columns: repeat(7, 1fr);
`;

const IconContainer = styled.div`
	display: flex;
	width: 56px;
	height: 56px;
	justify-content: flex-end;
	margin: auto;
`;

const EditIconContainer = styled(IconContainer)`
	justify-content: center;
	width: 30px;
	height: 30px;
	align-items: center;
	position: absolute;
	top: 0;
	right: 0;
	margin: 5px;
`;

const ActionIconContainer = styled.div`
	display: flex;
	width: 50px;
	height: 50px;
	margin: auto;
`;

const PhraseListContainer = styled.div`
	grid-area: phrases;
	display: grid;
	gap: 0.5rem;
	grid-template-columns: repeat(auto-fit, minmax(200px, 0.5fr));
`;

const ActionContainer = styled.div`
	grid-area: actions;
	display: flex;
	flex-direction: row;
	justify-content: space-around;
`;

const Phrase = styled.div<{ known: boolean }>`
	font-size: 18px;
	border: 2px solid
		${(props) => (props.known ? "#02bdd6" : "rgb(214, 164, 2)")};
	border-radius: 8px;
	background-color: rgb(2, 189, 214);
	cursor: pointer;
`;

const StyledSelect = styled(Select)`
	width: 100%;
`;

function App() {
	const [user] = useAuthState(auth);

	return (
		<div className="App">
			<div>{user ? <Page /> : <SignIn />}</div>
		</div>
	);
}

interface PhraseDoc {
	id: string;
	hungarian: string;
	english?: {
		en: string;
	};
	known: boolean;
}

const parsePhraseDoc = (
	id: string,
	hungarian: string,
	known: boolean,
	english?: { en: string }
): PhraseDoc => {
	return {
		id: id,
		hungarian: hungarian,
		known: known,
		english: english,
	};
};

const emptyPhrase: PhraseDoc = {
	id: "",
	hungarian: "",
	known: false,
};

const sessionOptions = [
	{ value: "all", label: "All" },
	{ value: "tomorrow", label: "Tomorrow" },
];

function Page() {
	const [user] = useAuthState(auth);
	const [wordsToTranslate, setWordsToTranslate] = useState("");
	const [inputSession, setInputSession] = useState("");
	const [flashcardPhrase, setFlashcardPhrase] = useState(emptyPhrase);
	const [flashcardFront, setFlashcardFront] = useState(true);
	const [isEditingTrans, setIsEditingTrans] = useState(false);

	const phrasesRef = firestore.collection("phrases");
	const flashcardBackRef = useRef<HTMLDivElement>(null);
	const query = phrasesRef;
	const [phrases] = useCollectionData(query, { idField: "id" });

	const handleClickPhrase = (phrase: PhraseDoc) => {
		setFlashcardFront(true);
		setTimeout(
			() => setFlashcardPhrase(phrase),
			(flashcardPhrase.hungarian || flashcardFront) === "" ? 0 : 250 // todo: redo card flip with css animations :laugh: then we dont need this haack
		);
	};

	const handleClickAction = (known: boolean) => {
		phrasesRef
			.doc(flashcardPhrase.id)
			.update({
				known: known,
			})
			.then(() => console.log("successful update of doc"));
	};

	const handleUpdateTranslation = (newTranslation?: string) => {
		if (newTranslation) {
			phrasesRef
				.doc(flashcardPhrase.id)
				.update({
					english: {
						en: newTranslation,
					},
				})
				.then(() => console.log("successfuly saved new trnaslation"));
			setIsEditingTrans(false);
		} else {
			console.error("got undfined new translations!!");
		}
	};

	const phraseList = phrases ? (
		phrases.map((p, indx) => (
			<Phrase
				key={"word-" + indx}
				onClick={() => {
					console.log(p.id);
					handleClickPhrase(
						parsePhraseDoc(p.id, p.hungarian, p.known, p.english)
					);
				}}
				known={p.known}
			>
				<div>{p.hungarian}</div>
			</Phrase>
		))
	) : (
		<div>NO Phrases found in db</div>
	);

	const parseAndStoreHungarianWords = async (input: string) => {
		const phraseArray = input
			.split("\n")
			.filter((phrase) => !["-", ""].includes(phrase));
		phraseArray.forEach((phrase) => {
			phrasesRef
				.add({
					uid: user?.uid,
					hungarian: phrase,
					known: false,
				})
				.then((docRef) => {
					console.log("Document written with ID: ", docRef.id);
				})
				.catch((error) => {
					console.error("Error adding document: ", error);
				});
		});
	};

	const handleFlashCardClick = (
		e: React.MouseEvent<HTMLDivElement, MouseEvent>
	) => {
		e.preventDefault();
		setFlashcardFront(!flashcardFront);
	};

	const handleFlashcardKeydown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && isEditingTrans) {
			handleUpdateTranslation(flashcardBackRef.current?.innerText);
		}
	};

	return (
		<PageContainer>
			<Header>
				<AddContainer>
					<StyledSelect
						value={inputSession}
						onChange={(selectedOption: string) =>
							setInputSession(selectedOption)
						}
						options={sessionOptions}
					/>
					<Input
						value={wordsToTranslate}
						onChange={(e) => setWordsToTranslate(e.target.value)}
						placeholder="copy paste skype convos"
					/>
					<AddButton
						onClick={() => {
							parseAndStoreHungarianWords(wordsToTranslate);
						}}
					>
						Click me to translate
					</AddButton>
				</AddContainer>
				<Title>Flashcards</Title>
				<IconContainer onClick={() => auth.signOut()}>
					<User />
				</IconContainer>
			</Header>
			<FlashcardDiv>
				<ReactCardFlip
					isFlipped={!flashcardFront}
					flipDirection="vertical"
				>
					<Flashcard onClick={(e) => handleFlashCardClick(e)}>
						{flashcardPhrase.hungarian}
					</Flashcard>

					<FlashcardBack
						contentEditable={isEditingTrans}
						suppressContentEditableWarning={true}
						onClick={(e) =>
							isEditingTrans
								? console.log("can't flip while editing")
								: handleFlashCardClick(e)
						}
						ref={flashcardBackRef}
						onKeyDown={handleFlashcardKeydown}
					>
						<EditIconContainer
							onClick={(e) => {
								e.stopPropagation();
								if (isEditingTrans) {
									handleUpdateTranslation(
										flashcardBackRef.current?.innerText
									);
								}
								setIsEditingTrans(!isEditingTrans);
							}}
						>
							{isEditingTrans ? <FaSave /> : <FaEdit />}
						</EditIconContainer>
						{flashcardPhrase.english
							? flashcardPhrase.english.en
							: "NO TRANSLATION"}
					</FlashcardBack>
				</ReactCardFlip>
			</FlashcardDiv>
			<ActionContainer>
				<ActionIconContainer onClick={() => handleClickAction(true)}>
					<FaCheckCircle style={{ width: "auto", height: "auto" }} />
				</ActionIconContainer>
				<ActionIconContainer onClick={() => handleClickAction(false)}>
					<FaBrain style={{ width: "auto", height: "auto" }} />
				</ActionIconContainer>
			</ActionContainer>
			<PhraseListContainer>{phraseList}</PhraseListContainer>
		</PageContainer>
	);
}

function SignIn() {
	const signInWithGoogle = () => {
		const provider = new firebase.auth.GoogleAuthProvider();
		auth.signInWithPopup(provider);
	};

	return (
		<>
			<button className="sign-in" onClick={signInWithGoogle}>
				Sign in with Google
			</button>
			<p>
				Do not violate the community guidelines or you will be banned
				for life!
			</p>
		</>
	);
}

function SignOut() {
	return (
		auth.currentUser && (
			<button className="sign-out" onClick={() => auth.signOut()}>
				Sign Out
			</button>
		)
	);
}

export default App;
