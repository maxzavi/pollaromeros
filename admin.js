import { app, db } from "./firebase.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    getDocs,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const ADMIN_EMAIL = "mzavaletav@gmail.com";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const userInfo = document.getElementById("userInfo");
const adminPanel = document.getElementById("adminPanel");
const equiposAdmin = document.getElementById("equiposAdmin");

btnLogin.onclick = async () => {

    try {

        await signInWithPopup(auth, provider);

    } catch (e) {

        console.error(e);
        alert(e.message);

    }

};

btnLogout.onclick = () => signOut(auth);

onAuthStateChanged(auth, async user => {

    console.log(user);

    if (!user) {

        btnLogin.hidden = false;
        btnLogout.hidden = true;
        adminPanel.hidden = true;
        userInfo.innerHTML = "";

        return;

    }

    btnLogin.hidden = true;
    btnLogout.hidden = false;

    userInfo.innerHTML = user.email;

    if (user.email !== ADMIN_EMAIL) {

        adminPanel.hidden = true;
        userInfo.innerHTML += "<br>No autorizado";

        return;

    }

    adminPanel.hidden = false;

    cargarEquipos();

});

async function cargarEquipos(){

    equiposAdmin.innerHTML="";

    const snapshot = await getDocs(collection(db,"equipos"));

    snapshot.forEach(d=>{

        const e = d.data();

        equiposAdmin.innerHTML += `
            <div class="fila">

                <span>${e.nombre}</span>

                <select onchange="actualizar('${d.id}',this.value)">

                    <option ${e.resultado=="grupos"?"selected":""}>grupos</option>
                    <option ${e.resultado=="octavos"?"selected":""}>octavos</option>
                    <option ${e.resultado=="cuartos"?"selected":""}>cuartos</option>
                    <option ${e.resultado=="semifinal"?"selected":""}>semifinal</option>
                    <option ${e.resultado=="subcampeon"?"selected":""}>subcampeon</option>
                    <option ${e.resultado=="campeon"?"selected":""}>campeon</option>

                </select>

            </div>
        `;

    });

}

window.actualizar = async(id,resultado)=>{

    await updateDoc(doc(db,"equipos",id),{

        resultado

    });

};