const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let points= 0;
let enemies = [];
let bullets = [];

let mouse = {
    x: canvas.width/2,
    y: canvas.height/2
}
addEventListener('mousemove',(event)=>{
    mouse.x = event.clientX
    mouse.y = event.clientY

    //console.log(mouse);
});

addEventListener('click',Shoot);
addEventListener('keypress',(event)=>{
    if (event.code=="Space"){
        Shoot();
    }
})

class Circle {
    constructor(x,y,r,c){
        this.x = x;
        this.y = y;
        this.radius = r;
        this.color= c;
        this.img= new Image();
        this.img.src= "covid19.png";
       
       
        
    }
    draw(){
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius,0,Math.PI*
        2,false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.drawImage(this.img,363,325,50,50);
        
       
        
     
    }
    update(){
        this.draw();
    }
}
function randomIntFromRange(min, max){
    return Math.floor(Math.random() * (max-min+1) +min);
}
function Shoot(){
    let bullet = new Circle(player.x, player.y, 15, 'green');
    /* bullet.mx = mouse.x;
    bullet.my = mouse.y; */
    //console.log('Shoot');
    let vx = mouse.x - bullet.x;
    let vy = mouse.y - bullet.y;
    let speed = 6;

    let dist = Math.sqrt(vx * vx + vy + vy);
    bullet.dx = vx/ dist;
    bullet.dy = vy/ dist;

    bullet.dx *= speed;
    bullet.dy *=speed;

    bullets.push(bullet);
}
//Spawn Enemy
function SpawnEnemy(){
    let enemy = new Circle(canvas.width,canvas.height -345,10,'maroon');
    //setting the speed of the enemy

    enemy.speed = randomIntFromRange(4,7);
    enemy.health =
    enemies.push(enemy);
}

let player;
function Start (){
  
    player= new Circle(0,canvas.height/2,30,'#FFCEO')
}
let originalTimer = 150;
let spawnTimer = originalTimer;
function Update(){
    requestAnimationFrame(Update);
    ctx.clearRect(0,0, canvas.width,canvas.height);


    //bullets 
    for (let i =0; i< bullets.length; i++){
        let bullet = bullets [i];

        bullet.x +=bullet.dx;
        bullet.y +=bullet.dy;

        if (
            bullet.x < 0 ||
            bullet.x > canvas.width ||
            bullet.y < 0 ||
            bullet.y > canvas.height
        ){
            bullets.splice(i, 1);
            //console.log(bullets);
        }

        bullet.update();
    }
// Creating Enemies
spawnTimer--;
if (spawnTimer <= 0) {
    originalTimer = (originalTimer * 0.98 > 60) ?
    originalTimer * 0.98 : 60;
    spawnTimer = originalTimer;
    SpawnEnemy();

    //console.log('Spawn Enemy');
}
for (let i= 0; i < enemies.length; i++){
    let enemy = enemies[i];
    
    enemy.x -= enemy.speed;
    if (enemy.x < 0){
        enemies.splice(i,1);
        points = 0;
        originalTimer= 150;
        //console.log(enemies);
    }
    //pythogaras theorem to calculate distance between bullets
    for (let j = 0;j < bullets.length; j++){
        let bullet = bullets[j];

        let ax = bullet.x - enemy.x;
        let ay = bullet.y - enemy.y;
        let distance = Math.sqrt(ax*ax + ay*ay);

        if(distance < bullet.radius + enemy.radius){
            enemies.splice(i,1);
            bullets.splice(j,1);
            points +=100;
            console.log(points)
        }
    }
  enemy.update();
}
    /* player.x= mouse.x;
    player.y= mouse.y; */
    player.update();
    ctx.fillStyle = "#FF309";
    ctx.font = "28px sans-serif";
    ctx.textAlign="center";
    ctx.fillText("Corona Killed "+ points, canvas.width/2, 50);
    //ctx.fill();
}
Start();
Update();