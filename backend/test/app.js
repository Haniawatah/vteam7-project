import 'dotenv/config';

import chaiHttp from "chai-http";
import app from "../index.js";
import * as chai from "chai";
import { getDb, makeSalt, hashPassword, verifyPassword } from '../database.js';
import { connectDb, connectDbTest } from '../database.js';
const should = chai.should();
const expect = chai.expect;
const use = chai.use;

import * as database from '../database.js';



process.env.NODE_ENV = 'test';


console.log('DB_PASS:', process.env.DB_PASS);
console.log("-----------------------------------------------------");



const request = use(chaiHttp).request.execute;
before(async () => {
    // Connectar med databasen för att få testenra att fungera
    await connectDbTest();

    const db = getDb();
    //Tar bort så nya users varje gång
    await db.collection('users').deleteMany({});

});




let token;


describe.only('POST /register and login', () => {
    const email = `${Math.random().toString(10).substring(7)}@test.com`;
    const name = `${Math.random().toString(5)}test`;

    it('Should return a token', (done) => {
        request(app)
        .post('/v1/register')
        .send({ email: email, password: 123, name: name })
        .end((err, res) => {
            if (err) return done(err);
                token = res.body.token;
                res.body.token.should.be.a('string');
                res.should.have.status(200);
                const { user } = res.body;
                user.should.include({
                    email: email,
                    name: name
                });
            done();
        });
    });

    it('Logging into the new account', (done) => {
        request(app)
        .post('/v1/login')
        .send({ email: email, password: '123' })
        .end((err, res) => {
            if (err) return done(err);
                token = res.body.token;
                res.body.token.should.be.a('string');
                res.should.have.status(200);
                const { user } = res.body;
                user.should.include({
                    email: email,
                    name: name
                });
            done();
        });
    });

    it('Checking the profile of the account', (done) => {
        request(app)
        .get('/v1/profile')
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                console.log(" ---- Checking the profile ----")

                res.should.have.status(200);
                const { data } = res.body;
                data.should.include({
                    email: email,
                    name: name,
                });
            done();
        });
    });



    it('Checking the profile of the account', (done) => {
        request(app)
        .get('/v1/profile')
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                console.log(" ---- Checking the profile ----")

                res.should.have.status(200);
                const { data } = res.body;
                data.should.include({
                    email: email,
                    name: name,
                });
            done();
        });
    });
});












describe('GET /user/profile', () => {
    it('Should return a token', (done) => {
        request(app)
        .get('/v1/login')
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                console.log(res.body)
            done();
        });
    });
});




describe('POST /login', () => {
    const email = `${Math.random().toString(10).substring(7)}@test.com`;
    let token;
    let createdId;
    let objectData;
    it('Update the data in a document', (done) => {
        request(server)
            .post('/reg')
            .send({ name: 'test', email: email, password: '2' })
            .end((err, res) => {

                res.body.result.acknowledged.should.be.true;
                res.body.result.insertedId.should.be.a('string');

                done();
            });
    });

    it('Check if i can log in', (done) => {
    request(server)
        .post('/login')
        .send({ email: email, password: '2' })
        .end((err, res) => {
            token = res.body.token;
            console.log(res.body.token)
            res.should.have.status(200);
            res.body.token.should.be.a('string');
            done();
        });
    });
});


