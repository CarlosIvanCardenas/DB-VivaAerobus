var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "toor",
  database: "VivaAerobus"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

function getAeropuertos(id){
    var aeropuertos;
    con.query("SELECT IATA, ubicacion FROM aeropuerto", function (err, result, fields) {
        if (err) throw err;
        aeropuertos = JSON.parse(JSON.stringify(result));
        var sel = document.getElementById(id.id);
        var fragment = document.createDocumentFragment();
        aeropuertos.forEach(function(aeropuerto, index) {
            var opt = document.createElement('option');
            opt.innerHTML = aeropuerto.ubicacion;
            opt.value = aeropuerto.IATA;
            fragment.appendChild(opt);
        });
        sel.appendChild(fragment);
    });
}

var btnVuelos = true;
var ori;
var des;
var vuelos;
function getVuelos(){
    if(btnVuelos){
        btnVuelos = false;
        var o = document.getElementById("Origen");
        var d = document.getElementById("Destino");
        ori = o.options[o.selectedIndex].value;
        des = d.options[d.selectedIndex].value;
        var s = document.getElementById("fSalida");
        if(ori == des){
            btnVuelos = true;
            alert("Origen y destino deben ser diferentes");
        }
        else{
            con.query(`SELECT * FROM instanciaVuelo WHERE salida = \"${ori}\" AND llegada = \"${des}\" AND fecha = \"${s.value}\"`, function (err, result, fields) {
                if (err) throw err;
                vuelos = JSON.parse(JSON.stringify(result));
                if(vuelos.length == 0){
                    btnVuelos = true;
                    alert("No hay vuelos disponibles");
                }
                else{
                    tableCreate();
                }
            });
        }
    }
}

function tableCreate(){
    var body = document.body;
    var div = document.createElement('div');
        div.className = "container";
    var title = document.createElement("h3");
        title.innerHTML = "Vuelos disponibles: ";
        div.appendChild(title);
    var tbl  = document.createElement('table');
        tbl.className = "table table-striped";
        tbl.id = "tblVuelos";
    var tr = tbl.insertRow();
        tr.className = "thead";
    var td = tr.insertCell();
        td.appendChild(document.createTextNode("Fecha"));
    var td = tr.insertCell();
        td.appendChild(document.createTextNode("Origen"));
    var td = tr.insertCell();
        td.appendChild(document.createTextNode("Hora de salida"));
    var td = tr.insertCell();
        td.appendChild(document.createTextNode("Destino"));
    var td = tr.insertCell();
        td.appendChild(document.createTextNode("Hora de llegada"));
    vuelos.forEach(function(vuelo, index){
        var tr = tbl.insertRow();
        var td = tr.insertCell();
            td.appendChild(document.createTextNode(vuelo.fecha.substring(0, 10)));
        var td = tr.insertCell();
            td.appendChild(document.createTextNode(vuelo.salida));
        var td = tr.insertCell();
            td.appendChild(document.createTextNode(vuelo.horaSalida));
        var td = tr.insertCell();
            td.appendChild(document.createTextNode(vuelo.llegada));
        var td = tr.insertCell();
            td.appendChild(document.createTextNode(vuelo.horaLlegada));
    });
    div.appendChild(tbl);
    body.appendChild(div);
    getSchedules(div);
}

function getSchedules(container){
    var body = document.body;
    var div = document.createElement('div');
    div.className = "cont";
    var lbl  = document.createElement("label");
    lbl.innerHTML = "Seleccione su vuelo: ";
    div.appendChild(lbl);
    var schedules  = document.createElement("select");
    schedules.id = "Schedules";
    schedules.className = "form-control drop";
    var fragment = document.createDocumentFragment();
    vuelos.forEach(function(vuelo, index){
        var opt = document.createElement('option');
            opt.innerHTML = vuelo.horaSalida;
            opt.value = index;
            fragment.appendChild(opt);
    });
    schedules.appendChild(fragment);
    div.appendChild(schedules);
    var btn = document.createElement("button");
        btn.innerHTML = "Seleccionar horario";
        btn.className = "btn btn-success";
        btn.setAttribute("onclick", "tableSeats()");
        div.appendChild(btn);
    container.appendChild(div);
    body.appendChild(container);
}

function tableSeats(){
    var schedules = document.getElementById("Schedules");
    var schedule = schedules.options[schedules.selectedIndex];
    var date = document.getElementById("fSalida").value;
    con.query(`SELECT aNo FROM asiento WHERE aID = \"${vuelos[schedule.value].aID}\"`, function (err, result, fields) {
        if (err) {
            throw err;
        }
        else{
            var asientos = JSON.parse(JSON.stringify(result));
            var body = document.body;
            var div = document.createElement("div");
                div.className = "container";
            var title = document.createElement("h3");
                title.innerHTML = "Selecciona tu asiento: ";
                div.appendChild(title);
            var tbl = document.createElement("table");
                tbl.className = "table table-striped";
                tbl.id = "tblAsientos"
            for (let i = 0; i < asientos.length; i++) {
                const asiento = asientos[i];
                if(i % 4 == 0){
                    var tr = tbl.insertRow();
                }
                var td = tr.insertCell();
                    var btn = document.createElement("button");
                        btn.className = "btn btn-secondary";
                        btn.id = asiento.aNo;
                        btn.innerHTML = asiento.aNo;
                        btn.setAttribute("onclick", "selectAsiento(this)");
                    td.appendChild(btn);
            }
            con.query(`SELECT boleto.aNo FROM boleto NATURAL JOIN instanciaVuelo WHERE instanciaVuelo.aID = "${vuelos[schedule.value].aID}" AND instanciaVuelo.fecha = "${date}" AND instanciaVuelo.horaSalida = "${schedule.innerHTML}"`, function (err, result, fields) {
                if (err) throw err;
                else{
                    var ocupados = JSON.parse(JSON.stringify(result));
                    var index = 0;
                    var tbl = document.getElementById("tblAsientos");
                    for (var i = 0, row; row = tbl.rows[i]; i++) {
                        for (var j = 0, col; col = row.cells[j]; j++) {
                            if(col.children[0].innerHTML == ocupados[index].aNo){
                                if(index != ocupados.length-1)
                                    index++;
                                col.children[0].className = "btn btn-danger";
                                col.children[0].disabled = true;
                            }
                        }  
                     }
                }
            });
            div.appendChild(tbl);
            var row = document.createElement("div");
                row.className = "row justify-content-md-center";
            var h4 = document.createElement("h4");
                h4.innerHTML = "Selecciona tipo de equipaje: ";
                row.appendChild(h4);
            var form = document.createElement("div");
                form.className = "custom-control custom-radio custom-control-inline";
            var radio = document.createElement("input");
                radio.setAttribute("type", "radio");
                radio.className = "custom-control-input";
                radio.id = "rdoNormal";
                radio.value = "normal";
                radio.name = "equipaje";
                radio.checked = true;
                form.appendChild(radio);
            var lbl = document.createElement("label");
                lbl.className = "custom-control-label"
                lbl.setAttribute("for", "rdoNormal");
                lbl.innerHTML = "Normal";
                form.appendChild(lbl);
            row.appendChild(form);
            var form = document.createElement("div");
                form.className = "custom-control custom-radio custom-control-inline";
            var radio = document.createElement("input");
                radio.setAttribute("type", "radio");
                radio.className = "custom-control-input";
                radio.id = "rdoPremium";
                radio.value = "Premium";
                radio.name = "equipaje";
                form.appendChild(radio);
            var lbl = document.createElement("label");
                lbl.className = "custom-control-label"
                lbl.setAttribute("for", "rdoPremium");
                lbl.innerHTML = "Premium";
                form.appendChild(lbl);
            row.appendChild(form);
            div.appendChild(row);
            body.appendChild(div);
        }
    });
}

var currentAsiento = "";
function selectAsiento(btn){
    if(currentAsiento == ""){
        currentAsiento = btn.id;
    }
    else{
        var old = document.getElementById(currentAsiento);
        old.className = "btn btn-secondary";
        currentAsiento = btn.id;
    }
    btn.className = "btn btn-success";
    createForm();
}

var btnHorarios = true;
function createForm(){
    if(btnHorarios){
        btnHorarios = false;
        var body = document.body;
        var div = document.createElement('div');
            div.className = "container";
        var p = document.createElement("h3");
            p.innerHTML = "Introduce tus datos para comprar un boleto: ";
            div.appendChild(p);
        var f = document.createElement("form");
            f.className = "form-group";
        var ssn = document.createElement("input");
            ssn.className = "form-control";
            ssn.id = "ssn";
            ssn.setAttribute("type", "text");
            ssn.setAttribute("placeholder", "SSN");
            var lbl = document.createElement("label");
            lbl.innerHTML = "Social Security Number";
            var small = document.createElement("small");
            small.className = "form-text text-muted";
            small.innerHTML = "Si ya has comprado un boleto antes solamente ingresa tu SSN";
            f.appendChild(lbl);
            f.appendChild(ssn);
            f.appendChild(small);
        var row = document.createElement('div');
            row.className = "form-row";
        var col = document.createElement('div');
            col.className = "col";
        var fName = document.createElement("input");
            fName.className = "form-control";
            fName.id = "fName";
            fName.setAttribute("type", "text");
            fName.setAttribute("placeholder", "Nombre");
            var lbl = document.createElement("label");
            lbl.innerHTML = "Primer Nombre";
            col.appendChild(lbl);
            col.appendChild(fName);
            row.appendChild(col);
        var col = document.createElement('div');
            col.className = "col";
        var lName = document.createElement("input");
            lName.className = "form-control";
            lName.id = "lName";
            lName.setAttribute("type", "text");
            lName.setAttribute("placeholder", "Apellido");
            var lbl = document.createElement("label");
            lbl.innerHTML = "Apellido";
            col.appendChild(lbl);
            col.appendChild(lName);
            row.appendChild(col);
        f.appendChild(row);
        var row = document.createElement('div');
            row.className = "form-row";
        var col = document.createElement('div');
            col.className = "col";
        var tel = document.createElement("input");
            tel.className = "form-control";
            tel.id = "tel";
            tel.setAttribute("type", "tel");
            tel.setAttribute("placeholder", "Telefono");
            var lbl = document.createElement("label");
            lbl.innerHTML = "Numero de telefono";
            col.appendChild(lbl);
            col.appendChild(tel);
            row.appendChild(col);
        var col = document.createElement('div');
            col.className = "col";
        var email = document.createElement("input");
            email.className = "form-control";
            email.id = "email";
            email.setAttribute("type", "text");
            email.setAttribute("placeholder", "Email");
            var lbl = document.createElement("label");
            lbl.innerHTML = "Correo electronico";
            col.appendChild(lbl);
            col.appendChild(email);
            row.appendChild(col);
        var col = document.createElement('div');
            col.className = "col";
        var fdn = document.createElement("input");
            fdn.id = "fdn";
            fdn.setAttribute("type", "date");
            var lbl = document.createElement("label");
            lbl.innerHTML = "Fecha de Nacimiento";
            col.appendChild(lbl);
            var br = document.createElement("br");
            col.appendChild(br);
            col.appendChild(fdn);
            row.appendChild(col);
        f.appendChild(row);
        div.appendChild(f);
        var btn = document.createElement("button");
            btn.innerHTML = "Validar datos";
            btn.className = "btn btn-success";
            btn.setAttribute("onclick", "submitClient()");
            div.appendChild(btn);
        body.appendChild(div);
    }   
}

var btnSubmit = true;
function submitClient(){
    if(btnSubmit){
        btnSubmit = false;
        var ssn = document.getElementById("ssn").value;
        var fName = document.getElementById("fName").value;
        var lName = document.getElementById("lName").value;
        var tel = document.getElementById("tel").value;
        var email = document.getElementById("email").value;
        var fdn = document.getElementById("fdn").value;
        con.query(`SELECT count(SSN) AS count, nombre, apellido, telefono, email, FDN FROM cliente WHERE SSN = "${ssn}"`, function (err, result, fields) {
            if (err) throw err;
            var exists = JSON.parse(JSON.stringify(result));
            if (exists[0].count == 1){
                document.getElementById("fName").value = exists[0].nombre;
                document.getElementById("lName").value = exists[0].apellido;
                document.getElementById("tel").value = exists[0].telefono;
                document.getElementById("email").value = exists[0].email;
                document.getElementById("fdn").value = exists[0].FDN.substring(0, 10);
                getBoleto();
            }
            else{
                con.query(`INSERT INTO cliente VALUES (\"${ssn}\", \"${fName}\", \"${lName}\", \"${tel}\", \"${email}\", \"${fdn}\")`, function (err, result, fields) {
                    if (err){
                        alert(err.message);
                        btnSubmit = true;
                        throw err;
                    }
                    else{
                        getBoleto();
                    }
                });
            }
        });
    }
}

var boleto = {fecha:"", vID:"", tipoEquipaje:"", aNo:"", aID:"", cliente:""};
function getBoleto(){
    var schedules = document.getElementById("Schedules");
    var schedule = schedules.options[schedules.selectedIndex];
    boleto.fecha = document.getElementById("fSalida").value;
    boleto.vID = vuelos[schedule.value].vID;
    boleto.tipoEquipaje = document.querySelector('input[name="equipaje"]:checked').value;
    boleto.aNo = currentAsiento;
    boleto.aID = vuelos[schedule.value].aID
    boleto.cliente = document.getElementById("ssn").value;
    var fName = document.getElementById("fName").value;
    var lName = document.getElementById("lName").value;
            var body = document.body;
            var div = document.createElement('div');
                div.className = "container";
            var p = document.createElement("h3");
                p.innerHTML = "Revisa los datos de tu boleto: ";
                div.appendChild(p);
            var tbl = document.createElement("table");
                tbl.className = "table table-striped";
            var tr = tbl.insertRow();
            var td = tr.insertCell();
                td.appendChild(document.createTextNode("SSN"));
            var td = tr.insertCell();
                td.appendChild(document.createTextNode("Nombre"));
            var td = tr.insertCell();
                td.appendChild(document.createTextNode("Apellido"));
            var td = tr.insertCell();
                td.appendChild(document.createTextNode("Fecha"));
            var td = tr.insertCell();
                td.appendChild(document.createTextNode("Origen"));
            var td = tr.insertCell();
                td.appendChild(document.createTextNode("Hora de salida"));
            var td = tr.insertCell();
                td.appendChild(document.createTextNode("Destino"));
            var td = tr.insertCell();
                td.appendChild(document.createTextNode("Equipaje"));

            var tr = tbl.insertRow();
                tr.id = "data";
            var td = tr.insertCell();
                td.appendChild(document.createTextNode(boleto.cliente));
            var td = tr.insertCell();
                td.appendChild(document.createTextNode(fName));
            var td = tr.insertCell();
                td.appendChild(document.createTextNode(lName));
            var td = tr.insertCell();
                td.appendChild(document.createTextNode(boleto.fecha));
            var td = tr.insertCell();
                td.appendChild(document.createTextNode(ori));
            var td = tr.insertCell();
                td.appendChild(document.createTextNode(schedule.innerHTML));
            var td = tr.insertCell();
                td.appendChild(document.createTextNode(des));
            var td = tr.insertCell();
                td.appendChild(document.createTextNode(boleto.tipoEquipaje));
            div.appendChild(tbl);
            var btn = document.createElement("button");
                btn.className = "btn btn-success";
                btn.setAttribute("onclick", "submitBoleto()");
                btn.innerHTML = "Confirmar compra";
            div.appendChild(btn);
            body.appendChild(div);
}

var btnBoleto = true;
function submitBoleto(){
    if(btnBoleto){
        btnBoleto = false;
        con.query(`INSERT INTO boleto VALUE (NULL, \"${boleto.fecha}\", \"${boleto.vID}\", \"${boleto.tipoEquipaje}\", \"${boleto.aNo}\", \"${boleto.aID}\", \"${boleto.cliente}\")`, function (err, result, fields) {
            if (err) {
                throw err;
                alert(err.message);
            }
            else{
                alert("Compra realizada de manera exitosa.");
                location.reload();
            }
        });
    }
}