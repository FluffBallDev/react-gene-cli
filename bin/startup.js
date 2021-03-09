#!/usr/bin/env node
/**
 * Buildscript version 1.1.0
 * This contains the generator application
 * @since 1.0.0
 */
const fs = require('fs-extra');
const path = require('path');
const https = require('https');
const {
    exec
} = require('child_process');
const args = require('yargs').argv;

const packageFile = require('../package.json');
const scripts = `"start": "webpack serve --mode=development --env=development --port=3000",
"build": "webpack --mode=production"`;

const babel = `"babel": ${JSON.stringify(packageFile.babel)}`;
const thisProject = process.argv[2].toLowerCase();
const getDeps = (deps) =>
    Object.entries(deps)
    .map((dep) => `${dep[0]}@${dep[1]}`)
    .toString()
    .replace(/,/g, ' ')
    .replace(/^,/g, '')
    .replace(/fs-extra[^\s]+/g, '');
console.log("Running npm init...");
/**
 * Execute project
 */
exec(
    //Creates the directory and initializes the npm.
    `mkdir ${thisProject} && cd ${thisProject} && npm init -f`,
    (initErr, initStdout, initStderr) => {
        if (initErr) {
            console.error(`An error occurred during init phase... -> ${initErr}`);
            return;
        }
        //get the project package.json file to write to
        const packageJSON = `${thisProject}/package.json`;
        fs.readFile(packageJSON, (err, file) => {
            if (err) throw err;
            const data = file
                .toString()
                .replace('"test": "echo \\"Error: no test specified\\" && exit 1"', scripts)
                .replace('"keywords": []', `${babel}`);
            fs.writeFile(packageJSON, data, (err2) => err2 || true);
        });

        //List of files to copy from root directory to the project directory
        const filesToCopy = [
            'webpack.config.js',
            'index.html'
        ];
        for (let i = 0; i < filesToCopy.length; i += 1) {
            fs.createReadStream(path.join(__dirname, `../${filesToCopy[i]}`)).pipe(
                fs.createWriteStream(`${thisProject}/${filesToCopy[i]}`),
            );
        }

        /*
         *  Since NPM removes .gitinore by default, we add our own by downloading one from our github.
        */
        https.get(
            'https://raw.githubusercontent.com/FluffBallDev/react-gene-cli/main/.gitignore',
            (res) => {
                res.setEncoding('utf-8');
                let body = '';
                res.on('data', (data) => {
                    body += data;
                });
                res.on('end', () => {
                    fs.writeFile(`${thisProject}/.gitignore`, body, {
                        encoding: 'utf-8'
                    }, (err) => {
                        if (err) throw err;
                    });
                });
            },
        );
        console.log('npm init -- [completed]\n\n\n\n');
        console.log('Fetching dependencies... This might take a minute or two');
        const devDepends = getDeps(packageFile.devDependencies);
        const proDepends = getDeps(packageFile.dependencies);
        //Check if we want typescript
        if (args.typescript === 'true') {
            exec(
                //install dependencies and dev dependencies, and include typescript along them
                `cd ${thisProject} && git init && node -v && npm -v && npm i -D ${devDepends} && npm i -D typescript && npm i -S ${proDepends}`,
                (npmErr, npmStdout, npmStderr) => {
                    if (npmErr) {
                        console.error(`An error occurred during dependencies install -> ${npmErr}`);
                        return;
                    }
                    console.log(npmStdout);
                    console.log('Dependencies installed');
                    console.log('Setting up typescript...');
                    //Copy the tsconfig.json from /copy folder to current project root
                    fs.copy(path.join(__dirname, '../copy'), `${thisProject}/`)
                        .then(() =>
                            console.log(`Done!`),
                        ).catch((err) => console.error(err));
                    console.log('Copying addidional files');
                    //Copy everything inside /src into current project /src folder
                    fs.copy(path.join(__dirname, '../src'), `${thisProject}/src`)
                        .then(() =>
                            console.log(`Done!\n\nProject now ready!`),
                        ).catch((err) => console.error(err));
                },
            );
        } else if (args.typescript === 'false') {
            exec(
                `cd ${thisProject} && git init && node -v && npm -v && npm i -D ${devDepends} && npm i -S ${proDepends}`,
                (npmErr, npmStdout, npmStderr) => {
                    if (npmErr) {
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
        } else {
            //runs only if no --typescript parameter is provided on command line
            exec(
                `cd ${thisProject} && git init && node -v && npm -v && npm i -D ${devDepends} && npm i -S ${proDepends}`,
                (npmErr, npmStdout, npmStderr) => {
                    if (npmErr) {
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
        }
    },
);