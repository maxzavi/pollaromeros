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
    onSnapshot,
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
let partidosMap = {};
let unsubscribeEquipos = null;
let unsubscribePartidos = null;

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
        detenerListeners();

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
        detenerListeners();

        adminPanel.hidden = true;
        userInfo.innerHTML += "<br>No autorizado";

        return;

    }

    adminPanel.hidden = false;

    cargarEquipos();
    cargarPartidos();
});

function detenerListeners() {
    if (unsubscribeEquipos) {
        unsubscribeEquipos();
        unsubscribeEquipos = null;
    }

    if (unsubscribePartidos) {
        unsubscribePartidos();
        unsubscribePartidos = null;
    }
}

function cargarEquipos(){
    if (unsubscribeEquipos) {
        unsubscribeEquipos();
    }

    equiposAdmin.innerHTML="";

    unsubscribeEquipos = onSnapshot(collection(db,"equipos"), snapshot => {
        equiposAdmin.innerHTML="";

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

function numeroOpcional(valor) {
    return valor === "" ? null : Number(valor);
}

function calcularGanador(score1, score2, pen1, pen2, team1, team2) {
    if (score1 === null || score2 === null) {
        return null;
    }

    if (score1 > score2) {
        return team1;
    }

    if (score2 > score1) {
        return team2;
    }

    if (pen1 === null || pen2 === null) {
        return null;
    }

    if (pen1 > pen2) {
        return team1;
    }

    if (pen2 > pen1) {
        return team2;
    }

    return null;
}

function leerResultadoPartido(id, team1, team2) {
    const score1 = numeroOpcional(document.getElementById(`${id}_score1`).value);
    const score2 = numeroOpcional(document.getElementById(`${id}_score2`).value);
    const pen1 = numeroOpcional(document.getElementById(`${id}_pen1`).value);
    const pen2 = numeroOpcional(document.getElementById(`${id}_pen2`).value);

    return {
        score1,
        score2,
        pen1,
        pen2,
        winner: calcularGanador(score1, score2, pen1, pen2, team1, team2)
    };
}

function actualizarGanadorPartido(id, team1, team2) {
    const winnerSelect = document.getElementById(`${id}_winner`);
    const { winner } = leerResultadoPartido(id, team1, team2);

    winnerSelect.value = winner || "";
}

function crearTarjetaPartido(p) {
    const team1 = teamName(p.team1, partidosMap);
    const team2 = teamName(p.team2, partidosMap);
    const winner = calcularGanador(
        p.score1 ?? null,
        p.score2 ?? null,
        p.pen1 ?? null,
        p.pen2 ?? null,
        team1,
        team2
    );
    const row = document.createElement("div");

    row.className = "match-admin";
    row.dataset.matchId = p.id;

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

            <select id="${p.id}_winner" disabled>
                <option value="">Pendiente</option>
                <option value="${team1}" ${winner === team1 ? "selected" : ""}>${team1}</option>
                <option value="${team2}" ${winner === team2 ? "selected" : ""}>${team2}</option>
            </select>
        </div>

        <button class="save-match" type="button">
            💾 Guardar resultado
        </button>
    `;

    const saveButton = row.querySelector(".save-match");
    saveButton.addEventListener("click", () => guardarPartido(p.id, saveButton));

    row
        .querySelectorAll("input")
        .forEach(input => input.addEventListener("input", () => actualizarGanadorPartido(p.id, team1, team2)));

    return row;
}

function renderizarPartido(id) {
    const actual = matchesAdmin.querySelector(`[data-match-id="${id}"]`);
    const partido = partidosMap[id];

    if (!actual || !partido) {
        return;
    }

    actual.replaceWith(crearTarjetaPartido(partido));
}

function renderizarPartidosDependientes(id, visitados = new Set()) {
    if (visitados.has(id)) {
        return;
    }

    visitados.add(id);

    Object.values(partidosMap)
        .filter(p => p.team1 === id || p.team2 === id)
        .forEach(p => {
            renderizarPartido(p.id);
            renderizarPartidosDependientes(p.id, visitados);
        });
}

function cargarPartidos() {
    if (unsubscribePartidos) {
        unsubscribePartidos();
    }

    matchesAdmin.innerHTML = "";

    unsubscribePartidos = onSnapshot(collection(db, "matches"), snapshot => {
        matchesAdmin.innerHTML = "";

        partidosMap = {};
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

        partidos.forEach(p => matchesAdmin.appendChild(crearTarjetaPartido(p)));
    });
}
async function guardarPartido(id, boton) {
    const partido = partidosMap[id];
    const team1 = teamName(partido.team1, partidosMap);
    const team2 = teamName(partido.team2, partidosMap);

    const cambios = leerResultadoPartido(id, team1, team2);

    if (boton) {
        boton.disabled = true;
        boton.textContent = "Guardando...";
    }

    try {
        await updateDoc(doc(db, "matches", id), cambios);

        partidosMap[id] = {
            ...partidosMap[id],
            ...cambios
        };

        userInfo.textContent = `Partido ${id} actualizado`;

        renderizarPartidosDependientes(id);
    } catch (e) {
        console.error(e);
        userInfo.textContent = `Error actualizando ${id}`;
        alert(e.message);
    } finally {
        if (boton) {
            boton.disabled = false;
            boton.textContent = "💾 Guardar resultado";
        }
    }
}

window.guardarPartido = guardarPartido;
