const colorBtn = document.querySelector('.colorBtn');
const bodyBcg = document.querySelector('body');

const colors = ['yellow','red','orange','green','blue','purple','#3b5998','black','magenta'];


colorBtn.addEventListener('click',changeColor);

function changeColor(){
    //bodyBcg.style.backgroundColor = colors[0];
    let random = Math.floor(Math.random()*colors.length)
    bodyBcg.style.backgroundColor = colors[random];
}