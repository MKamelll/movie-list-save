//dependacies
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const readline = require('readline-sync');
const fs = require('fs');

// vars
let fileName;
let baseUrl = 'https://www.imdb.com';
let buttonEnabled = '#main > div > div.lister.list.detail.sub-list > div.footer.filmosearch > div > div > a.flat-button.lister-page-next.next-page';

//initiate the program
getListLink();

//get user list from terminal
function getListLink() {
    let listLink = readline.question('Enter List Link: ');
    if (listLink !== '') {
        checkForDomain(listLink);
    } else {
        console.log('Not Valid!');
        let exitKey = readline.keyIn('Do You Want To Exit? (y/n)', { limit: 'yn' });
        if (exitKey == 'y') {
            return true;
        } else {
            getListLink();
        };
    };
};

//check for the domain
function checkForDomain(listLink) {
    if (listLink.includes('imdb.com')) {
        fileName = readline.question('Enter Saved File Name: ');
        console.log('-------Processing-------');
        imdbList(listLink);
    } else {
        console.log('Not Supported!');
        let exitKey = readline.keyIn('Do You Want To Exit? (y/n)', { limit: 'yn' });
        if (exitKey == 'y') {
            return true;
        } else {
            getListLink();

        }
    }
}

//making the movies list
let movies = [];

//get data from imdb list
function imdbList(listLink) {


    // request        
    fetch(listLink)
        .then(response => response.text())
        .then(body => {
            //scraping with selectors
            let $ = cheerio.load(body);
            let titles = $('.lister-item-content').find('h3');
            let genres = $('.lister-item-content > p:nth-child(2) > span.genre');
            let ratings = $('.lister-item-content > div.ipl-rating-widget > div.ipl-rating-star.small > span.ipl-rating-star__rating');
            // looping through data providing values to the correspondant properties
            for (let i = 0; i < titles.length; i++) {
                title = $(titles[i]).text().trim();
                title = title.replace(/^\d+\s*/, '').replace(/\W/g, ' ').replace(/\s\s+/, ' ');
                genre = $(genres[i]).text().trim();
                genre = genre.replace(/\W/g, ' ').replace(/\s\s+/, ' ');
                if (ratings[i] == undefined) {
                    rating = 'No Rating!';
                } else {
                    rating = ratings[i].children[0].data;
                }
                // generating movie object
                let movie = {
                    'title': title,
                    'genre': genre,
                    'rating': rating
                }
                movies.push(movie);
            }
            let next = $(buttonEnabled).attr('href');
            let nextPage;
            while (next != undefined) {
                nextPage = baseUrl + next;
                imdbList(nextPage);
                break;
            }
            return movies;
        })
        .then(movies => generateFile(movies))
        .catch(e => console.log('Can\'t Get List or All Of It!'))
}



//write data to Excel
function generateFile(movies) {
    let writer = fs.createWriteStream(fileName + '.xls');
    let headers = 'Title ' + '\t' + 'Genre' + '\t' + 'Rating' + '\n';
    writer.write(headers);
    writer.on('close', () => {
        console.log('Working!');
    })

    for (let i = 0; i < movies.length; i++) {
        let row = movies[i].title + '\t' + movies[i].genre + '\t' + movies[i].rating + '\n';
        writer.write(row);
    }
    writer.close();

}

