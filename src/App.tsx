import React, { useState } from "react";
import "./App.css";

import styled from "styled-components";
import ReactCardFlip from "react-card-flip";

import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";

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
 * - make a primate "flashcard"
 * - make a word list when you click a word that word becomes flashcard
 *
 * Next:
 * - css styling and all that goodnexx
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

const Header = styled.div`
	display: flex;
	flex-direction: row;
	height: 100px;
	width: auto;
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
`;

const FlashcardBack = styled(Flashcard)`
	background-color: lightblue;
`;

const IconContainer = styled.div`
	flex: 1;
	display: flex;
	width: 56px;
	height: 56px;
	justify-content: flex-end;
	margin: auto;
`;

const Phrase = styled.div`
	margin: auto;
	max-width: 700px;
	font-size: 24px;
	border-bottom: 3px solid coral;
	padding-bottom: 20px;
	margin-bottom: 20px;
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
	hungarian: String;
	english?: {
		en: String;
	};
	known: Boolean;
}

const parsePhraseDoc = (
	hungarian: String,
	known: boolean,
	english?: { en: String }
): PhraseDoc => {
	return {
		hungarian: hungarian,
		known: known,
		english: english,
	};
};

const emptyPhrase: PhraseDoc = {
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

	const phrasesRef = firestore.collection("phrases");
	const query = phrasesRef;
	const [phrases] = useCollectionData(query, { idField: "id" });

	const handleClickPhrase = (phrase: PhraseDoc) => {
		setFlashcardFront(true);
		setFlashcardPhrase(phrase);
	};

	const phraseList = phrases ? (
		phrases.map((p, indx) => (
			<Phrase
				key={"word-" + indx}
				onClick={() => {
					handleClickPhrase(
						parsePhraseDoc(p.hungarian, p.known, p.english)
					);
				}}
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
			<ReactCardFlip isFlipped={!flashcardFront} flipDirection="vertical">
				<Flashcard onClick={(e) => handleFlashCardClick(e)}>
					{flashcardPhrase.hungarian}
				</Flashcard>

				<FlashcardBack onClick={(e) => handleFlashCardClick(e)}>
					{flashcardPhrase.english
						? flashcardPhrase.english.en
						: "NO TRANSLATION"}
				</FlashcardBack>
			</ReactCardFlip>
			{phraseList}
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
