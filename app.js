import { db } from "./firebase.js";

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

const banderas = {
    "Argentina": "https://flagcdn.com/ar.svg",
    "Brasil": "https://flagcdn.com/br.svg",
    "España": "https://flagcdn.com/es.svg",
    "Francia": "https://flagcdn.com/fr.svg",
    "Inglaterra": "https://flagcdn.com/gb-eng.svg",
    "Alemania": "https://flagcdn.com/de.svg",
    "Japón": "https://flagcdn.com/jp.svg",
    "Paraguay": "https://flagcdn.com/py.svg",
    "Países Bajos": "https://flagcdn.com/nl.svg",
    "Marruecos": "https://flagcdn.com/ma.svg",
    "Costa de Marfil": "https://flagcdn.com/ci.svg",
    "Noruega": "https://flagcdn.com/no.svg",
    "Suecia": "https://flagcdn.com/se.svg",
    "México": "https://flagcdn.com/mx.svg",
    "Ecuador": "https://flagcdn.com/ec.svg",
    "República Democrática del Congo": "https://flagcdn.com/cd.svg",
    "Congo DR": "https://flagcdn.com/cd.svg",
    "Bélgica": "https://flagcdn.com/be.svg",
    "Senegal": "https://flagcdn.com/sn.svg",
    "Estados Unidos": "https://flagcdn.com/us.svg",
    "Bosnia y Herzegovina": "https://flagcdn.com/ba.svg",
    "Austria": "https://flagcdn.com/at.svg",
    "Portugal": "https://flagcdn.com/pt.svg",
    "Croacia": "https://flagcdn.com/hr.svg",
    "Suiza": "https://flagcdn.com/ch.svg",
    "Argelia": "https://flagcdn.com/dz.svg",
    "Australia": "https://flagcdn.com/au.svg",
    "Egipto": "https://flagcdn.com/eg.svg",
    "Cabo Verde": "https://flagcdn.com/cv.svg",
    "Colombia": "https://flagcdn.com/co.svg",
    "Ghana": "https://flagcdn.com/gh.svg"
};

function calcularPuntos(equipo, posicion, equipos) {
    const resultado = equipos[equipo]?.resultado || "grupos";

    let puntos = puntosPorResultado[resultado] || 0;

    if (resultado === "campeon") {
        puntos += bonoCampeon[posicion] || 0;
    }

    return {
        resultado,
        puntos
    };
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

        let total = 0;

        let html = `
            <div class="card">
                <h2>${p.nombre}</h2>
        `;

        p.pronosticos.forEach((equipo, index) => {
            const bandera = banderas[equipo] || "";
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
            puntos: total
        });
    });

    listaRanking.sort((a, b) => b.puntos - a.puntos);

    rankingPanel.hidden = false;

    ranking.innerHTML = `
        <ol>
            ${listaRanking.map((j, index) => `
                <li>
                    <span>${medalla(index)} ${j.nombre}</span>
                    <b>${j.puntos} pts</b>
                </li>
            `).join("")}
        </ol>
    `;
}

cargarParticipantes();