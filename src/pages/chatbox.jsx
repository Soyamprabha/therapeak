import "./styles/chatbox.css";
import { useState, useEffect } from "react";
import { auth, db } from "../services/firebase";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  orderBy,
  query,
  serverTimestamp,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Chatbox = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkIfUserLoggedIn = setInterval(() => {
      if (auth.currentUser) {
        clearInterval(checkIfUserLoggedIn);

        const userRef = doc(db, "users", auth.currentUser.uid);
        getDoc(userRef)
          .then((doc) => {
            console.log("running");
            if (doc.exists) {
              setUser(auth.currentUser);
            } else {
              console.error("User not found");
              alert("User Data Not Found");
              navigate("/");
            }
          })
          .catch((error) => {
            console.error("Error retrieving user data: ", error);
            alert("User Data Not Found");
            navigate("/");
          });
      }
    }, 500);

    setTimeout(() => {
      clearInterval(checkIfUserLoggedIn);
      if (!auth.currentUser) {
        console.error("User not logged in");
        alert("Login or Signup First");
        navigate("/");
      }
    }, 5000);
  }, [navigate]);

  
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    const messagesRef = collection(db, "messages");
    const q = query(messagesRef, orderBy("createdAt"), limit(25));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newMessages = [];
      querySnapshot.forEach((doc) => {
        newMessages.push(doc.data());
      });
      console.log("hello")
      setMessages(newMessages);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const [allusers, setAllusers] = useState([]);
  useEffect(() => {
    const userRef = collection(db, "users");
    const qr = query(userRef);
    const unsubscribe = onSnapshot(qr, (querySnapshot) => {
      const newUsers = [];
      querySnapshot.forEach((doc) => {
        newUsers.push(doc.data());
      });
      setAllusers(newUsers);
    });
    return () => {
      unsubscribe();
    };
  }, []);
  const [formValue, setFormValue] = useState("");

  const sendMessage = async (e) => {
    e.preventDefault();
    const messagesRef = collection(db, "messages");
    const { uid, photoURL } = user;

    await addDoc(messagesRef, {
      text: formValue,
      createdAt: serverTimestamp(),
      uid,
      photoURL,
    });

    setFormValue("");
  };
  return user == null ? (
    <p
      style={{
        height: "700vh",
      }}
    >
      Loading user data...
    </p>
  ) : (
    <div className="row chatBox">
      <div className="col containerr">
        <div className="leftSide">
          <div className="header">
            <h4> Your friends</h4>
          </div>

          <div className="search_chat">
            <div>
              <input type="text" placeholder="Search or start new chat" />
            </div>
          </div>
          <div className="chatlist">
            {allusers.map((usera, index) => (
              <div className="block unread" key={index}>
                <div className="imgBox">
                  <img src={usera.photoURL} className="cover" alt="" />
                </div>
                <div className="details">
                  <div className="listHead">
                    <h4>{usera.name}</h4>
                  </div>
                  <div className="message_p">
                    <p>{usera.bio}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="col-8 rightSide">
        <div className="header">
          <div className="imgText">
            <div className="userimg">
              <img src={user.photoURL} alt="" className="cover" />
            </div>
            <h4>
              {user.displayName}
              <br />
              <span>online</span>
            </h4>
          </div>
        </div>

        <div className="chatbox">
          <>
            <main>
              {messages &&
                messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
            </main>
          </>
        </div>

        <div className="chat_input">
          <form style={{minWidth:"20rem"}} onSubmit={sendMessage}>
            <input
              style={{float:"left"}} 
              type="text"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              placeholder="Type a message"
            />
            <button id="sendMessage"  type="submit" disabled={!formValue}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

function ChatMessage(props) {
  const { text, uid, photoURL } = props.message;
  console.log(text);

  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";

  return (
    <>
      <div className={`message ${messageClass}`}>
        <img
          src={
            photoURL || "https://api.adorable.io/avatars/23/abott@adorable.png"
          }
          style={{ height: "50px", width: "50px" }}
          alt="prp"
        />
        <p>{text}</p>
      </div>
    </>
  );
}

export default Chatbox;
