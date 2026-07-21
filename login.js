import { auth } from "./firebase-config.js";

import {

signInWithEmailAndPassword

} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const email = document.getElementById("email");

const password = document.getElementById("password");

const loginBtn = document.getElementById("loginBtn");

loginBtn.onclick = () => {

signInWithEmailAndPassword(

auth,

email.value,

password.value

)

.then(()=>{

window.location.href="home.html";

})

.catch(()=>{

alert("Invalid Email or Password");

});

};
