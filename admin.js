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
const statusInfo = document.getElementById("statusInfo");
const authCard = document.querySelector(".auth-card");
const adminPanel = document.getElementById("adminPanel");
const equiposAdmin = document.getElementById("equiposAdmin");
const hideFinalizedMatches = document.getElementById("hideFinalizedMatches");
let partidosMap = {};
let partidosLista = [];
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

hideFinalizedMatches.addEventListener("change", renderizarListaPartidos);

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function renderUserInfo(user, autorizado = true) {
    const nombre = user.displayName || user.email;
    const inicial = (nombre || "?").trim().charAt(0).toUpperCase();
    const nombreSeguro = escapeHtml(nombre);
    const emailSeguro = escapeHtml(user.email);
    const avatarSeguro = user.photoURL ? escapeHtml(user.photoURL) : "";
    const inicialSeguro = escapeHtml(inicial);

    userInfo.innerHTML = `
        ${avatarSeguro
            ? `<img class="user-avatar" src="${avatarSeguro}" alt="${nombreSeguro}" referrerpolicy="no-referrer" onerror="this.outerHTML='<span class=&quot;user-avatar user-avatar-fallback&quot;>${inicialSeguro}</span>'">`
            : `<span class="user-avatar user-avatar-fallback">${inicialSeguro}</span>`}
        <span class="user-meta">
            <strong>${nombreSeguro}</strong>
            <small>${emailSeguro}</small>
        </span>
        ${autorizado ? "" : `<span class="auth-badge">No autorizado</span>`}
    `;
}

onAuthStateChanged(auth, async user => {

    console.log(user);

    if (!user) {
        detenerListeners();

        btnLogin.hidden = false;
        btnLogout.hidden = true;
        authCard.classList.remove("is-authenticated");
        adminPanel.hidden = true;
        userInfo.innerHTML = "";
        statusInfo.textContent = "";

        return;

    }

    btnLogin.hidden = true;
    btnLogout.hidden = false;
    authCard.classList.add("is-authenticated");

    renderUserInfo(user);
    statusInfo.textContent = "";

    if (user.email !== ADMIN_EMAIL) {
        detenerListeners();

        adminPanel.hidden = true;
        renderUserInfo(user, false);

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

        const equipos = [];

        snapshot.forEach(d => {
            equipos.push({
                id: d.id,
                ...d.data()
            });
        });

        equipos.sort((a, b) => {
            if ((a.finalizado === true) !== (b.finalizado === true)) {
                return a.finalizado === true ? 1 : -1;
            }

            return (a.nombre || a.id).localeCompare(b.nombre || b.id, "es");
        });

        equipos.forEach(e=>{

            const finalizado = e.finalizado === true;

            equiposAdmin.innerHTML += `
                <div class="fila equipo-admin-row ${finalizado ? "is-finalized" : ""}" data-equipo-id="${e.id}">

                    <span>${e.nombre}</span>

                    <select ${finalizado ? "disabled" : ""}>

                        <option ${e.resultado=="grupos"?"selected":""}>grupos</option>
                        <option ${e.resultado=="octavos"?"selected":""}>octavos</option>
                        <option ${e.resultado=="cuartos"?"selected":""}>cuartos</option>
                        <option ${e.resultado=="semifinal"?"selected":""}>semifinal</option>
                        <option ${e.resultado=="subcampeon"?"selected":""}>subcampeon</option>
                        <option ${e.resultado=="campeon"?"selected":""}>campeon</option>

                    </select>

                    <button class="finalize-team" type="button" ${finalizado ? "disabled" : ""}>
                        Finalizó
                    </button>

                </div>
            `;

        });

        equiposAdmin.querySelectorAll(".equipo-admin-row").forEach(row => {
            const id = row.dataset.equipoId;
            const select = row.querySelector("select");
            const finalizeButton = row.querySelector(".finalize-team");

            select.addEventListener("change", () => actualizar(id, select.value));
            finalizeButton.addEventListener("click", () => finalizarEquipo(id, finalizeButton));
        });
    });

}

async function actualizar(id, resultado){

    await updateDoc(doc(db,"equipos",id),{

        resultado

    });

}

async function finalizarEquipo(id, boton) {
    const row = equiposAdmin.querySelector(`[data-equipo-id="${id}"]`);
    const select = row?.querySelector("select");
    const resultado = select?.value;

    if (!confirm(`¿Finalizar la fase del equipo ${id}? Ya no se podrá editar desde admin.`)) {
        return;
    }

    if (boton) {
        boton.disabled = true;
        boton.textContent = "Finalizando...";
    }

    try {
        await updateDoc(doc(db, "equipos", id), {
            resultado,
            finalizado: true
        });

        statusInfo.textContent = `Equipo ${id} finalizado`;

        if (row) {
            row.classList.add("is-finalized");
        }

        if (select) {
            select.disabled = true;
        }
    } catch (e) {
        console.error(e);
        statusInfo.textContent = `Error finalizando ${id}`;
        alert(e.message);

        if (boton) {
            boton.disabled = false;
            boton.textContent = "Finalizó";
        }
    }
}

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
    const row = document.querySelector(`[data-match-id="${id}"]`);
    const winnerSelect = document.getElementById(`${id}_winner`);
    const { score1, score2, winner } = leerResultadoPartido(id, team1, team2);
    const tieneMarcador = score1 !== null && score2 !== null;

    winnerSelect.value = winner || "";

    if (row) {
        row.classList.toggle("is-scored", tieneMarcador);
        row.classList.toggle("is-pending", !tieneMarcador);
        row.querySelector(".match-status").textContent = tieneMarcador ? "Con marcador" : "Pendiente";
    }
}

function crearTarjetaPartido(p) {
    const team1 = teamName(p.team1, partidosMap);
    const team2 = teamName(p.team2, partidosMap);
    const tieneMarcador = p.score1 !== null && p.score1 !== undefined && p.score2 !== null && p.score2 !== undefined;
    const finalizado = p.finalizado === true;
    const disabled = finalizado ? "disabled" : "";
    const winner = calcularGanador(
        p.score1 ?? null,
        p.score2 ?? null,
        p.pen1 ?? null,
        p.pen2 ?? null,
        team1,
        team2
    );
    const row = document.createElement("div");

    row.className = `match-admin ${tieneMarcador ? "is-scored" : "is-pending"} ${finalizado ? "is-finalized" : ""}`;
    row.dataset.matchId = p.id;

    row.innerHTML = `
        <div class="match-admin-header">
            <div>
                <h3>${p.id}</h3>
                <small>${p.fase}<br>${formatFecha(p.kickoff)}</small>
            </div>
            <span class="match-status">${finalizado ? "Finalizado" : tieneMarcador ? "Con marcador" : "Pendiente"}</span>
        </div>

        <div class="team-admin">
            <div class="team-admin-name">
                ${flagImg(team1)}
                <span>${team1}</span>
            </div>

            <input id="${p.id}_score1" type="number" value="${p.score1 ?? ""}" placeholder="GF" ${disabled}>
            <input id="${p.id}_pen1" type="number" value="${p.pen1 ?? ""}" placeholder="Pen" ${disabled}>
        </div>

        <div class="team-admin">
            <div class="team-admin-name">
                ${flagImg(team2)}
                <span>${team2}</span>
            </div>

            <input id="${p.id}_score2" type="number" value="${p.score2 ?? ""}" placeholder="GF" ${disabled}>
            <input id="${p.id}_pen2" type="number" value="${p.pen2 ?? ""}" placeholder="Pen" ${disabled}>
        </div>

        <div class="winner-select">
            <label>Ganador</label>

            <select id="${p.id}_winner" disabled>
                <option value="">Pendiente</option>
                <option value="${team1}" ${winner === team1 ? "selected" : ""}>${team1}</option>
                <option value="${team2}" ${winner === team2 ? "selected" : ""}>${team2}</option>
            </select>
        </div>

        <div class="match-actions">
        <button class="save-match" type="button" ${disabled}>
            💾 Guardar resultado
        </button>
        <button class="finalize-match" type="button" ${disabled}>
            Finalizar
        </button>
        </div>
    `;

    const saveButton = row.querySelector(".save-match");
    const finalizeButton = row.querySelector(".finalize-match");

    saveButton.addEventListener("click", () => guardarPartido(p.id, saveButton));
    finalizeButton.addEventListener("click", () => finalizarPartido(p.id, finalizeButton));

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

function renderizarListaPartidos() {
    matchesAdmin.innerHTML = "";

    const partidosVisibles = hideFinalizedMatches.checked
        ? partidosLista.filter(p => p.finalizado !== true)
        : partidosLista;

    partidosVisibles.forEach(p => matchesAdmin.appendChild(crearTarjetaPartido(p)));
}

function cargarPartidos() {
    if (unsubscribePartidos) {
        unsubscribePartidos();
    }

    matchesAdmin.innerHTML = "";

    unsubscribePartidos = onSnapshot(collection(db, "matches"), snapshot => {
        partidosMap = {};
        partidosLista = [];

        snapshot.forEach(d => {
            const item = { id: d.id, ...d.data() };
            partidosMap[d.id] = item;
            partidosLista.push(item);
        });

        partidosLista.sort((a, b) => {
            if (a.kickoff && b.kickoff) {
                return new Date(a.kickoff) - new Date(b.kickoff);
            }

            return a.orden - b.orden;
        });

        renderizarListaPartidos();
    });
}
async function guardarPartido(id, boton) {
    const partido = partidosMap[id];

    if (partido.finalizado === true) {
        statusInfo.textContent = `Partido ${id} ya está finalizado`;
        return;
    }

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

        statusInfo.textContent = `Partido ${id} actualizado`;

        renderizarPartidosDependientes(id);
    } catch (e) {
        console.error(e);
        statusInfo.textContent = `Error actualizando ${id}`;
        alert(e.message);
    } finally {
        if (boton) {
            boton.disabled = false;
            boton.textContent = "💾 Guardar resultado";
        }
    }
}

async function finalizarPartido(id, boton) {
    const partido = partidosMap[id];
    const team1 = teamName(partido.team1, partidosMap);
    const team2 = teamName(partido.team2, partidosMap);
    const resultado = leerResultadoPartido(id, team1, team2);

    if (resultado.score1 === null || resultado.score2 === null) {
        statusInfo.textContent = `Completa los goles de ${id} antes de finalizar`;
        return;
    }

    if (!resultado.winner) {
        statusInfo.textContent = `Completa los penales de ${id} para definir ganador`;
        return;
    }

    if (!confirm(`¿Finalizar el partido ${id}? Ya no se podrá editar el marcador desde admin.`)) {
        return;
    }

    const cambios = {
        ...resultado,
        finalizado: true
    };
    let finalizadoOk = false;

    if (boton) {
        boton.disabled = true;
        boton.textContent = "Finalizando...";
    }

    try {
        await updateDoc(doc(db, "matches", id), cambios);

        partidosMap[id] = {
            ...partidosMap[id],
            ...cambios
        };
        finalizadoOk = true;

        statusInfo.textContent = `Partido ${id} finalizado`;
        renderizarPartido(id);
        renderizarPartidosDependientes(id);
    } catch (e) {
        console.error(e);
        statusInfo.textContent = `Error finalizando ${id}`;
        alert(e.message);
    } finally {
        if (boton && !finalizadoOk) {
            boton.disabled = false;
            boton.textContent = "Finalizar";
        }
    }
}

window.guardarPartido = guardarPartido;
