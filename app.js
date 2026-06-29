fetch("data.json")
.then(r=>r.json())
.then(data=>{

    const ranking=document.getElementById("ranking");
    const participantes=document.getElementById("participantes");

    const lista=[];

    data.participantes.forEach(p=>{

        let total=0;

        let html=`
        <div class="card">
            <h3>${p.nombre}</h3>
        `;

        p.pronosticos.forEach((equipo,index)=>{

            const info = data.equipos[equipo];
            const resultado = info.resultado;
            const bandera = info.bandera;
            let puntos=data.puntos[resultado];

            if(resultado==="campeon"){
                puntos+=data.bonoCampeon[index];
            }

            total+=puntos;

            html += `
            <div class="fila">

                <div class="equipo">
                    <span class="bandera">${bandera}</span>
                    <span>${equipo}</span>
                </div>

                ${
                    data.mostrarPuntajes
                    ? `<span>${puntos} pts</span>`
                    : ""
                }

            </div>
            `;

        });

        if(data.mostrarPuntajes){

            html+=`
            <div class="total">
                ${total} pts
            </div>
            `;

        }

        participantes.innerHTML+=html;

        lista.push({
            nombre:p.nombre,
            puntos:total
        });

    });

    lista.sort((a,b)=>b.puntos-a.puntos);

    let rankingHtml="<ol>";

    lista.forEach(j=>{

        rankingHtml+=`
        <li>
            ${j.nombre}
            <b>${j.puntos} pts</b>
        </li>
        `;

    });

    rankingHtml+="</ol>";

    if(data.mostrarPuntajes){
        ranking.innerHTML=rankingHtml;
    }else{
        ranking.style.display="none";
    }
});