function calculate() {
    var billamt = document.getElementById("billamt").value;
    var serviceamt = document.getElementById("serviceamt").value;
    var peopleamt = document.getElementById("peopleamt").value;
    if (billamt === "" || serviceamt === 0) {
        alert("Please enter a value first");
        return;
    }
    if (peopleamt === "" || peopleamt <= 0) {
        peopleamt = 1;
        document.getElementById("each").style.display = "none";
    } else {
        document.getElementById("each").style.display = "block";
    }
    var total = (billamt * serviceamt) / peopleamt;
    total = Math.round(total * 100) / 100;
    total = total.toFixed(2);
    document.getElementById("totaltip").style.display = "block ";
    document.getElementById("tip").innerHTML = total;
}
document.getElementById("totaltip").style.display = "none";
document.getElementById("each").style.display = "none";
document.getElementById("btnClick").onclick = function() {
    calculate();
}