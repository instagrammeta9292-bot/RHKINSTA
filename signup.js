import { auth } from "./firebase-config.js";

import {

createUserWithEmailAndPassword

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const email=document.getElementById("email");

const password=document.getElementById("password");

const signupBtn=document.getElementById("signupBtn");

signupBtn.onclick=()=>{

createUserWithEmailAndPassword(

auth,

email.value,

password.value

)

.then(()=>{

alert("Account Created");

window.location.href="home.html";

})

.catch((error)=>{

alert(error.message);

});

};
