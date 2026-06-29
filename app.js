import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const participantes = document.getElementById("participantes");
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

async function cargarParticipantes(){

    participantes.innerHTML="";

    const querySnapshot = await getDocs(collection(db,"participantes"));

    querySnapshot.forEach(doc=>{

        const p = doc.data();

        let html=`

        <div class="card">

            <h2>${p.nombre}</h2>

        `;

        p.pronosticos.forEach((equipo,index)=>{

            html += `
            <div class="equipo">
                <img class="bandera" src="${banderas[equipo]}" alt="${equipo}">
                <span>${equipo}</span>
            </div>
            `;

        });

        html+="</div>";

        participantes.innerHTML+=html;

    });

}

cargarParticipantes();