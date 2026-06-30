import { db } from "./firebase.js";
import { flags } from "./flags.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const participantes = document.getElementById("participantes");
const rankingPanel = document.getElementById("rankingPanel");
const ranking = document.getElementById("ranking");
const totalParticipantes = document.getElementById("totalParticipantes");
const pozoAcumulado = document.getElementById("pozoAcumulado");

const APORTE = 5.0;

const puntosPorResultado = {
    campeon: 10,
    subcampeon: 7,
    semifinal: 5,
    cuartos: 3,
    octavos: 1,
    grupos: 0
};

const bonoCampeon = [3, 2, 1];

function calcularPuntos(equipo, posicion, equipos) {
    const resultado = equipos[equipo]?.resultado || "grupos";
    let puntos = puntosPorResultado[resultado] || 0;

    if (resultado === "campeon") {
        puntos += bonoCampeon[posicion] || 0;
    }

    return { resultado, puntos };
}

async function cargarEquipos() {
    const snapshot = await getDocs(collection(db, "equipos"));
    const equipos = {};

    snapshot.forEach(doc => {
        equipos[doc.id] = doc.data();
    });

    return equipos;
}

function medalla(index) {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}.`;
}

function renderTeam(nombre, score, penalties, isWinner) {
    const flag = flags[nombre];

    return `
        <div class="team ${isWinner ? "winner" : ""}">
            <span class="team-name">
                ${
                    flag
                        ? `<img class="bandera" src="${flag}" alt="${nombre}">`
                        : `<span class="bandera-placeholder">🏳️</span>`
                }
                ${nombre}
            </span>

            <strong>
                ${score ?? ""}
                ${penalties !== null && penalties !== undefined ? `(${penalties})` : ""}
            </strong>
        </div>
    `;
}

async function cargarParticipantes() {
    participantes.innerHTML = "";
    ranking.innerHTML = "";

    const equipos = await cargarEquipos();
    const querySnapshot = await getDocs(collection(db, "participantes"));

    const cantidad = querySnapshot.size;
    const pozo = cantidad * APORTE;

    totalParticipantes.textContent = cantidad;
    pozoAcumulado.textContent = `S/. ${pozo.toFixed(2)}`;

    const listaRanking = [];

    querySnapshot.forEach(doc => {
        const p = doc.data();
        const avatar = "./img/avatars/web/" + p.nombre.replaceAll(" ", "") + ".webp";

        let total = 0;

        let html = `
            <div class="card">
                <div class="participant-header">
                    <img class="avatar" src="${avatar}" alt="${p.nombre}">
                    <h2>${p.nombre}</h2>
                </div>
        `;

        p.pronosticos.forEach((equipo, index) => {
            const bandera = flags[equipo] || "";
            const { resultado, puntos } = calcularPuntos(equipo, index, equipos);

            total += puntos;

            html += `
                <div class="fila">
                    <div class="equipo">
                        ${
                            bandera
                                ? `<img class="bandera" src="${bandera}" alt="${equipo}">`
                                : `<span class="bandera-placeholder">🏳️</span>`
                        }
                        <span>${index + 1}. ${equipo}</span>
                    </div>

                    <div class="puntaje-equipo">
                        <small>${resultado}</small>
                        <strong>${puntos} pts</strong>
                    </div>
                </div>
            `;
        });

        html += `
                <div class="total">
                    Total: ${total} pts
                </div>
            </div>
        `;

        participantes.innerHTML += html;

        listaRanking.push({
            nombre: p.nombre,
            puntos: total,
            avatar
        });
    });

    listaRanking.sort((a, b) => b.puntos - a.puntos);

    rankingPanel.hidden = false;

    ranking.innerHTML = `
        <ol>
            ${listaRanking.map((j, index) => `
                <li>
                    <span class="ranking-person">
                        <img class="avatar-ranking" src="${j.avatar}" alt="${j.nombre}">
                        ${medalla(index)} ${j.nombre}
                    </span>

                    <b>${j.puntos} pts</b>
                </li>
            `).join("")}
        </ol>
    `;
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

function formatDia(kickoff) {
    if (!kickoff) return "Sin fecha";

    return new Date(kickoff).toLocaleDateString("es-PE", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        timeZone: "America/Lima"
    });
}

function resolverEquipo(ref, matches) {
    if (!ref) return "TBD";

    const match = matches[ref];

    if (match) {
        return match.winner || `Ganador ${ref}`;
    }

    return ref;
}

function renderBracket(matches, fase = "Todos") {
    const container = document.getElementById("bracketContainer");

    let lista = Object.entries(matches)
        .map(([id, data]) => ({ id, ...data }));

    if (fase !== "Todos") {
        lista = lista.filter(m => m.fase === fase);
    }

    lista.sort((a, b) => {
        if (a.kickoff && b.kickoff) {
            return new Date(a.kickoff) - new Date(b.kickoff);
        }

        return a.orden - b.orden;
    });

    const grupos = {};

    lista.forEach(m => {
        const dia = formatDia(m.kickoff);

        if (!grupos[dia]) {
            grupos[dia] = [];
        }

        grupos[dia].push(m);
    });

    container.innerHTML = Object.entries(grupos).map(([dia, partidos]) => `
        <div class="match-day">
            <h3>${dia}</h3>

            ${partidos.map(m => {
                const equipo1 = resolverEquipo(m.team1, matches);
                const equipo2 = resolverEquipo(m.team2, matches);

                return `
                    <div class="match-card">
                        <div class="match-title">${m.id} · ${m.fase}</div>
                        <div class="match-date">${formatFecha(m.kickoff)}</div>

                        ${renderTeam(equipo1, m.score1, m.pen1, m.winner === equipo1)}
                        ${renderTeam(equipo2, m.score2, m.pen2, m.winner === equipo2)}
                    </div>
                `;
            }).join("")}
        </div>
    `).join("");
}

async function cargarMatches() {
    const snapshot = await getDocs(collection(db, "matches"));
    const data = {};

    snapshot.forEach(doc => {
        data[doc.id] = doc.data();
    });

    return data;
}

async function iniciarLlave() {
    const matches = await cargarMatches();

    document.querySelectorAll(".tab").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            renderBracket(matches, btn.dataset.fase);
        });
    });

    renderBracket(matches, "Todos");
}

cargarParticipantes();
iniciarLlave();