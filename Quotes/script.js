const simpleQuotes = [{

        name: 'Aberjhani,',
        quote: '“This is what our love is––a sacred pattern of unbroken unity sewn flawlessly invisible inside all other images, thoughts, smells, and sounds.”'
    }, {

        name: 'Aberjhani',
        quote: '“Your pain is a school unto itself–– and your joy a lovely temple.”'
    }, {

        name: 'Chris Mentillo',
        quote: '“A woman does not become whole until she has a baby.”'
    }, {

        name: '',
        quote: '“Your future may hinge on your ability to disconnect yourself with the world and connect with your soul.”'
    }, {

        name: 'Benny Bellamacina',
        quote: '“Iron deficiency can lead to a wardrobe full of crumpled clothes”'
    }, {

        name: 'Stanley Victor Paskavich',
        quote: '“As far as me and fame, from my creations I will  be dead and famous long before I know it.”'
    }, {

        name: 'Aberjhani',
        quote: '“Know yourself fearlessly (even quietly) for all the things you are.”'
    }, {

        name: 'Robert Graves',
        quote: 'There is no money in poetry,but there is  no poetry in money, either.'
    }, {

        name: 'Oscar Wilde',
        quote: '“Be yourself; everyone else is already taken.”'
    }, {

        name: 'Frank Zappa',
        quote: '“So many books, so little time.”'
    },

]
const quoteBtn = document.querySelector('#quoteBtn');
const quoteAuthor = document.querySelector('#quoteAuthor');
const quote = document.querySelector('#quote');
quoteBtn.addEventListener('click', displayQuote);

function displayQuote() {
    let number = Math.floor(Math.random() * simpleQuotes.length);
    //console.log(number);
    quoteAuthor.innerHTML = simpleQuotes[number].name;
    quote.innerHTML = simpleQuotes[number].quote;
}