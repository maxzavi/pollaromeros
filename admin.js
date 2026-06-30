import { app, db } from "./firebase.js";
import { matches } from "./matches.js";
import { flags } from "./flags.js";
const matchesAdmin = document.getElementById("matchesAdmin");
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
    doc,
    setDoc
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
    cargarPartidos();
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

async function importarMatches(){

    if(!confirm("¿Importar todos los partidos a Firestore?"))
        return;

    const boton=document.getElementById("btnImportMatches");

    boton.disabled=true;
    boton.textContent="Importando...";

    try{

        for(const [id,data] of Object.entries(matches)){

            await setDoc(
                doc(db,"matches",id),
                data
            );

            console.log(id);
        }

        alert("Todos los partidos fueron importados.");

    }catch(e){

        console.error(e);

        alert("Error importando.");

    }finally{

        boton.disabled=false;
        boton.textContent="Importar partidos";

    }

}
function formatFecha(kickoff) {
    if (!kickoff) return "";

    return new Date(kickoff).toLocaleString("es-PE", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Lima"
    });
}
function teamName(team, partidos) {
    if (!team) return "TBD";

    if (partidos[team]) {
        return partidos[team].winner || `Ganador ${team}`;
    }

    return team;
}

function flagImg(team) {
    return flags[team]
        ? `<img class="bandera" src="${flags[team]}" alt="${team}">`
        : `<span class="bandera-placeholder">🏳️</span>`;
}
async function cargarPartidos() {
    matchesAdmin.innerHTML = "";

    const snapshot = await getDocs(collection(db, "matches"));

    const partidosMap = {};
    const partidos = [];

    snapshot.forEach(d => {
        const item = { id: d.id, ...d.data() };
        partidosMap[d.id] = item;
        partidos.push(item);
    });

    partidos.sort((a, b) => {
        if (a.kickoff && b.kickoff) {
            return new Date(a.kickoff) - new Date(b.kickoff);
        }

        return a.orden - b.orden;
    });

    partidos.forEach(p => {
        const team1 = teamName(p.team1, partidosMap);
        const team2 = teamName(p.team2, partidosMap);

        const row = document.createElement("div");
        row.className = "match-admin";

        row.innerHTML = `
            <div class="match-admin-header">
                <div>
                    <h3>${p.id}</h3>
                    <small>${p.fase}<br>${formatFecha(p.kickoff)}</small>
                </div>
            </div>

            <div class="team-admin">
                <div class="team-admin-name">
                    ${flagImg(team1)}
                    <span>${team1}</span>
                </div>

                <input id="${p.id}_score1" type="number" value="${p.score1 ?? ""}" placeholder="GF">
                <input id="${p.id}_pen1" type="number" value="${p.pen1 ?? ""}" placeholder="Pen">
            </div>

            <div class="team-admin">
                <div class="team-admin-name">
                    ${flagImg(team2)}
                    <span>${team2}</span>
                </div>

                <input id="${p.id}_score2" type="number" value="${p.score2 ?? ""}" placeholder="GF">
                <input id="${p.id}_pen2" type="number" value="${p.pen2 ?? ""}" placeholder="Pen">
            </div>

            <div class="winner-select">
                <label>Ganador</label>

                <select id="${p.id}_winner">
                    <option value="">Pendiente</option>
                    <option value="${team1}" ${p.winner === team1 ? "selected" : ""}>${team1}</option>
                    <option value="${team2}" ${p.winner === team2 ? "selected" : ""}>${team2}</option>
                </select>
            </div>

            <button class="save-match" onclick="guardarPartido('${p.id}')">
                💾 Guardar resultado
            </button>
        `;

        matchesAdmin.appendChild(row);
    });
}
window.guardarPartido = async function(id) {
    const score1 = document.getElementById(`${id}_score1`).value;
    const score2 = document.getElementById(`${id}_score2`).value;
    const pen1 = document.getElementById(`${id}_pen1`).value;
    const pen2 = document.getElementById(`${id}_pen2`).value;
    const winner = document.getElementById(`${id}_winner`).value;

    await updateDoc(doc(db, "matches", id), {
        score1: score1 === "" ? null : Number(score1),
        score2: score2 === "" ? null : Number(score2),
        pen1: pen1 === "" ? null : Number(pen1),
        pen2: pen2 === "" ? null : Number(pen2),
        winner: winner || null
    });

    userInfo.textContent = `Partido ${id} actualizado`;

    cargarPartidos();
};


