const hexNumbers = [0,1,2,3,4,5,6,7,8,9,'A','B','C','D','E','F'];
const hexBtn = document.querySelector('.hexbtn');
const bodyBcg = document.querySelector('body');
const hex = document.querySelector('.hex');

hexBtn.addEventListener('Click',getHex);

function getHex(){
    let hexCol= '#';

    for (let i=0; i++){
        let rendom = Math.floor(Math.random()*hexNumbers.length);
        hexCol += hexNumbers[random];
        console.log(hexCol);

    }
    
}