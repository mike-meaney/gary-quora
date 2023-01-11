const fs = require('fs'); 
const yaml = require('js-yaml'); 

const main = async (args) => {
    const serviceRootDir = args[0];
    const serviceName = args[1];
    const serviceDir = `${serviceRootDir}/${serviceName}`;

    const service = yaml.load(fs.readFileSync(`${serviceDir}/service.yml`));
    const metrics = yaml.load(fs.readFileSync(`${serviceDir}/metrics.yml`));
    const crossServiceDb = yaml.load(fs.readFileSync(`${serviceDir}/dashboards/${serviceName}-crossservice.yml`));
    const serviceDb = yaml.load(fs.readFileSync(`${serviceDir}/dashboards/${serviceName}.yml`));

    console.log(JSON.stringify(crossServiceDb));
};

const args = process.argv.slice(2);
main(args)
    .then(() => {})
    .catch(console.error);
