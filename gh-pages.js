var ghpages = require('gh-pages');

ghpages.publish(
    'public',
    {
        branch: 'gh-pages',
        repo: 'https://github.com/ConnorHorn/AdvantageScoutWebEarlyDev',
        user: {
            name: 'ConnorHorn',
            email: 'connorhornet@gmail.com',

        },
        dotfiles: true
    },
    () => {
        console.log('Deploy Complete!');
    }
)