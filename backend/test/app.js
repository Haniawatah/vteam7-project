import 'dotenv/config';

import chaiHttp from "chai-http";
import server from "../index.js";
import * as chai from "chai";
const should = chai.should();
const expect = chai.expect;
const use = chai.use;

import database from "../database.js";
import users from "../models/user.js"


process.env.NODE_ENV = 'test';


console.log('DB_PASS:', process.env.DB_PASS);
console.log("-----------------------------------------------------");



const request = use(chaiHttp).request.execute;


let token;




describe('posts', () => {
    describe('GET /elsparkcyklar', () => {
    it('Should get bikes', (done) => {
        request(server)
            .get('/v1/elsparkcyklar')
            .end((err, res) => {
                const { doc } = res.body;
                res.should.have.status(200);
                res.body.should.be.an('object');
                console.log(res.body);
                done();
            });
    });
});
});