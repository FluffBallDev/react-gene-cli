#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');

const packageFile = require('../package.json');
const scripts = `"start": "webpack serve --mode=development --env=development --port=3000",
"build": "webpack --mode=production"`;

const babel = `"babel": ${JSON.stringify(packageFile.babel)}`;
const thisProject = process.argv[2].toLowerCase();
const getDeps = (deps) =>
    Object.entries(deps)
        .map((dep) => `${dep[0]}@${dep[1]}`)
        .toString()
        .replace(/,/g,' ')
        .replace(/^,/g, '')
        .replace(/fs-extra[^\s]+/g, '');
    console.log("Running npm init...");
exec(
    `mkdir ${thisProject} && cd ${thisProject} && npm init -f`,
    (initErr, initStdout, initStderr) => {
        if(initErr){
            console.error(`An error occurred during init phase... -> ${initErr}`);
            return;
        }

        const packageJSON = `${thisProject}/package.json`;
        fs.readFile(packageJSON, (err, file) => {
            if(err) throw err;
            const data = file
                .toString()
                .replace('"test": "echo \\"Error: no test specified\\" && exit 1"', scripts)
                .replace('"keywords": []', `${babel}`);
        fs.writeFile(packageJSON, data, (err2) => err2 || true);
        });
        const filesToCopy =[
            'webpack.config.js',
            'index.html'
        ];
        for(let i = 0; i < filesToCopy.length; i+=1) {
            fs.createReadStream(path.join(__dirname, `../${filesToCopy[i]}`)).pipe(
                fs.createWriteStream(`${thisProject}/${filesToCopy[i]}`),
            );
        }
        https.get(
            'https://raw.githubusercontent.com/FluffBallDev/react-gene-cli/main/.gitignore',
            (res) => {
                res.setEncoding('utf-8');
                let body = '';
                res.on('data', (data) => {
                    body += data;
                });
                res.on('end', () => {
                    fs.writeFile(`${thisProject}/.gitignore`, body, {encoding: 'utf-8'}, (err) => {
                        if(err) throw err;
                    });
                });
            },
        );
        console.log('npm init -- [completed]\n\n\n\n');
        console.log('Fetching dependencies... This might take a minute or two');
        const devDepends = getDeps(packageFile.devDependencies);
        const proDepends = getDeps(packageFile.dependencies);
        exec(
            `cd ${thisProject} && git init && node -v && npm -v && npm i -D ${devDepends} && npm i -S ${proDepends}`,
            (npmErr, npmStdout, npmStderr) => {
                if(npmErr){
                    console.error(`An error occurred during dependencies install -> ${npmErr}`);
                    return;
                }
                console.log(npmStdout);
                console.log('Dependencies installed!');
                console.log('Copying addidional files...');
                fs.copy(path.join(__dirname, '../src'), `${thisProject}/src`)
                    .then(() => 
                        console.log(`Done!\n\nProject now ready.`),
                ).catch((err) => console.error(err));
            },
        );
    },
);