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
    "Alemania": "https://flagcdn.com/de.svg"
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