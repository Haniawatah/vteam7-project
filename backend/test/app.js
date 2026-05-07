import 'dotenv/config';

import chaiHttp from "chai-http";
import app from "../server.js";
import * as chai from "chai";
import { getDb, makeSalt, hashPassword } from '../database.js';
import { closeDbTest, connectDbTest } from '../database.js';

const should = chai.should(); // eslint-disable-line no-unused-vars
const expect = chai.expect; // eslint-disable-line no-unused-vars
const use = chai.use;



let scooterId;
let accountUserObjectId;

let adminEmail;
let adminPassword;
let adminId;

const request = use(chaiHttp).request.execute;
before(async () => {
    // Connectar med databasen för att få testenra att fungera
    await connectDbTest();

    const db = getDb();



    const users = db.collection('users');
    await users.createIndex({ email: 1 }, { unique: true }).catch(() => {});
    await users.createIndex({ id: 1 }, { unique: true }).catch(() => {});

    const runId = Date.now();
    adminEmail = `admin${Date.now()}@gmail.com`;
    adminId = `test_user${Date.now()}`;
    adminPassword = process.env.ADMIN_PASSWORD || 'adminvteam7';
    const salt = makeSalt();
    const passwordHash = hashPassword(adminPassword, salt);


    await users.insertOne({
        id: adminId,
        name: 'Admin',
        email: adminEmail,
        role: 'admin',
        wallet: 1000,
        enabled: true,
        passwordSalt: salt,
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
    });


    //Här gör vi saker som testar saker som ?? createAt istället för t.ex date

    //Test för saker som ??, så vi täcker fler branches
    await users.insertMany([
        { id: `test1_${runId}`, email: `2${runId}@test.com`, role: 'user', wallet: 10, name: 'tst1' },
        { id: `test2_${runId}`, email: `5${runId}@test.se`, role: null, wallet: null, username: `test2_${runId}` },
        { id: `test3_${runId}`, email: `1${runId}@test.com`, wallet: 0 }
    ]);


    const firstUser = await users.findOne({ id: `test1_${runId}` });
    if (!firstUser) throw new Error("Test user 'test1' not found");
    accountUserObjectId = firstUser._id.toString();


    const scooters = db.collection('scooters');

    let scooter = await scooters.findOne({ status: 'Available' });

    scooterId = scooter.id;


    await users.find({}).toArray();
});



after(async () => {
    await closeDbTest();
});




let token;
let secondToken;
let adminToken;
let createdScooterId;
let rideId;


let accountUserId;



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
                accountUserId = res.body.user.id
            done();
        });
    });

    it('Checking the profile of the account', (done) => {
        request(app)
        .get('/v1/user/profile')
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);

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
        .get('/v1/user/profile')
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);

                res.should.have.status(200);
                const { data } = res.body;
                data.should.include({
                    email: email,
                    name: name,
                });
            done();
        });
    });


    //ADDING MONEY TO WALLET
    it('ADding money to our wallet', (done) => {
        request(app)
        .put('/v1/user/wallet/add')
        .set("x-access-token", token)
        .send({ amount: 50 })
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(200);
            done();
        });
    });


    //Get wallet
    it('Get wallet balance', (done) => {
        request(app)
        .get('/v1/user/wallet')
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(200);
            done();
        });
    });



    //PAYMENT STUFF
    it('Adding payment method', (done) => {
        request(app)
        .put('/v1/user/payment')
        .set("x-access-token", token)
        .send({ cardNumber: '1234567890123456', expiryDate: '11/22' })
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(200);
            done();
        });
    });

    it('Changing / adding (card stuff) payment method', (done) => {
        request(app)
        .get('/v1/user/payment')
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(200);
            done();
        });
    });


    it('Check specific ride(log)', (done) => {
        request(app)
        .get(`/v1/logs/ride/ride_9309a162-4fe6-47d4-92d1-f4f89ed44933`)
        .set("x-access-token", token)
        .end((err, res) => {
            res.should.have.status(403);
            res.body.should.have.property('message', 'Forbidden');
            done();
        });
    });

    it('Checking all the scooters (for admin) this checks as a normal user [should fail]', (done) => {
        request(app)
        .get('/v1/admin/users')
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                res.body.should.have.property('message', 'Admin only');
            done();
        });
    });

/*
    it('Resetting the scooters and cancelling the logs  this checks as a normal user [should fail]', (done) => {
        request(app)
        .post('/v1/admin/scooter/reset')
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(403);
                res.body.should.have.property('message', 'Admin only');
            done();
        });
    });
*/





    it('Renting a scooter', (done) => {
        request(app)
        .post(`/v1/ride/start/${scooterId}`)
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                res.body.should.be.an('object');
                res.body.should.have.property('id');
                res.body.should.have.property('scooterId', scooterId);
                rideId = res.body.id
            done();
        });
    });


    it('Renting a scooter [FAIL] Renting a scooter that doesnt exist', (done) => {
        request(app)
        .post(`/v1/ride/start/NotWorking`)
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(404);
                res.body.should.have.property('message', 'Scooter not found');
            done();
        });
    });

    it('Renting a scooter that is already InUse', (done) => {
        request(app)
        .post(`/v1/ride/start/${scooterId}`)
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(409);
                res.body.should.have.property('message', 'Scooter not available');

            done();
        });
    });

    //GETTING ACTIVE RIDE
    it('Getting the data for the active ride', (done) => {
        request(app)
        .get(`/v1/ride/active/${rideId}`)
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                res.body.should.have.property('price')
            done();
        });
    });


    //Getting active from the user
    it('Getting a users active ride', (done) => {
        request(app)
        .get(`/v1/ride/user/active`)
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(200);
                res.body.should.have.property('success')
            done();
        });
    });



    //GETTING THE PRICE
    it('Getting the price for the ride', (done) => {
        request(app)
        .get(`/v1/ride/price/${rideId}`)
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                res.body.should.have.property('price')
            done();
        });
    });


    //Ending the ride
    it('Ending the ride', (done) => {
        request(app)
        .post(`/v1/ride/end/${rideId}`)
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                res.body.should.have.property('ok', true);
                res.body.should.have.property('ride');
            done();
        });
    });


    //Ending the ride [fail]
    it('Ending the ride [FAIL] ride not active', (done) => {
        request(app)
        .post(`/v1/ride/end/${rideId}`)
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(409);
                res.body.should.have.property('message', 'Ride is not active');
            done();
        });
    });


    //Ending the ride [fail]
    it('Ending the ride [FAIL] ride doesnt exist', (done) => {
        request(app)
        .post(`/v1/ride/end/NotWorking`)
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(404);
                res.body.should.have.property('message', 'Ride not found');
            done();
        });
    });




    //Getting price for fake ride
    it('Getting the price for the ride [FAIL] we use a fake ride id', (done) => {
        request(app)
        .get(`/v1/ride/price/NotWorking`)
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(404);
                res.body.should.have.property('message', 'Ride not found');
            done();
        });
    });


    //Getting Active data for fake ride
    it('Getting the active data [FAIL] we use a fake ride id', (done) => {
        request(app)
        .get(`/v1/ride/active/NotWorking`)
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(404);
                res.body.should.have.property('message', 'Ride not found');
            done();
        });
    });




    //Ride histories
    it('Getting ride history for completed and cancelled rides', (done) => {
        request(app)
        .get(`/v1/ride/history`)
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(200);
            done();
        });
    });



    it('Getting full history for rides', (done) => {
        request(app)
        .get(`/v1/ride/all/history`)
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                res.body.should.be.an('array');
            done();
        });
    });



    /*
    it('Renting a scooter', (done) => {
        request(app)
        .post(`/v1/ride/start/SCOOT-007`)
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                res.body.should.be.an('object');
                res.body.should.have.property('id');
                res.body.should.have.property('scooterId', 'SCOOT-007');
                zoneRideId = res.body.id
            done();
        });
    });
    */


    //Ending the ride
    /*it('Ending the ride', (done) => {
        request(app)
        .post(`/v1/ride/end/${zoneRideId}`)
        .set("x-access-token", token)
        .end((err, res) => {
            if (err) return done(err);
                res.body.should.have.property('ok', true);
                res.body.should.have.property('ride');
            done();
        });
    });
 */
});





//FOR ADMIN ROUTES

describe.only('Checking stuff for the admin', () => {
    before(async () => {
        const res = await request(app)
            .post('/v1/login')
            .send({ email: adminEmail, password: adminPassword });

        if (res.status !== 200) throw new Error('Admin login failed in setup');
        adminToken = res.body.token;
    });

    it('Checking the profile of the account for an (admin)', (done) => {
        request(app)
        .get('/v1/user/profile')
        .set("x-access-token", adminToken)
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(200);
                const { data } = res.body;
                data.should.include({
                    email: adminEmail
                });
                data.name.should.be.oneOf(['Admin', 'Hani']);
            done();
        });
    });



    it('Checking all the scooters (for admin)', (done) => {
        request(app)
        .get('/v1/admin/users')
        .set("x-access-token", adminToken)
        .end((err, res) => {
            if (err) return done(err);
                res.body.should.be.an('array');
                res.should.have.status(200);
            done();
        });
    });


    it('Resetting the scooters and cancelling the logs', (done) => {
        request(app)
        .post('/v1/admin/scooter/reset')
        .set("x-access-token", adminToken)
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(200);
                res.body.should.be.an('object');
                res.body.should.have.property('ok', true);
                res.body.should.have.property('message', 'Simulation reset');
            done();
        });
    });

    //The data for the scooter we create
    const scooterData = {
        status: 'Available',
        city: 'Stockholm',
        batteryLevel: 50,
        id: `TEST-SCOOTER-${Math.random().toString(4)}`,
        location: {
            lat: 59.32621866724524,
            lng: 18.07225845159779
        },
        createdAt: new Date()
    }

    it('Adding a scooter to the database / system', (done) => {
        request(app)
        .post('/v1/scooters')
        .set("x-access-token", adminToken)
        .send(scooterData)
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(201);
                res.body.should.include({ id: scooterData.id, status: 'Available', city: 'Stockholm' });
                createdScooterId = res.body.id
            done();
        });
    });


    it('Changing the status of a scooter', (done) => {
        request(app)
        .put(`/v1/scooters/${scooterData.id}`)
        .set("x-access-token", adminToken)
        .send({status: 'Off'})
        .end((err, res) => {
            if (err) return done(err);
            res.should.have.status(200);
            res.body.should.have.property('message', 'Scooter updatde');
            done();
        });
    });



    it('Changing the status of a scooter that doesnt exsist', (done) => {
        request(app)
        .put(`/v1/scooters/notFoundScooter`)
        .set("x-access-token", adminToken)
        .send({status: 'Off'})
        .end((err, res) => {
            if (err) return done(err);
            res.should.have.status(404);
            res.body.should.have.property('message', 'Scooter not found');
            done();
        });
    });



    it('Deleting a scooter from the database / system', (done) => {
        request(app)
        .delete(`/v1/scooters/${createdScooterId}`)
        .set("x-access-token", adminToken)
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(200);
                res.body.should.have.property('ok', true);
                res.body.should.have.property('deletedCount', 1);
            done();
        });
    });



    it('Deleting a scooter from the database / system that doesnt exsist [Supposed to fail]', (done) => {
        request(app)
        .delete(`/v1/scooters/Radnom-Scooter-Testing}`)
        .set("x-access-token", adminToken)
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(200);
                res.body.should.have.property('deletedCount', 0);
            done();
        });
    });




    //GET THE LOGS AND INVOICES AND STUFF

    it('Check all the invoices', (done) => {
        request(app)
        .get(`/v1/invoices/all`)
        .set("x-access-token", adminToken)
        .end((err, res) => {
            res.body.should.be.a('array');
            done();
        });
    });



    it('Check all the subscription logs', (done) => {
        request(app)
        .get(`/v1/logs/subs`)
        .set("x-access-token", adminToken)
        .end((err, res) => {
            res.body.should.be.a('array');
            done();
        });
    });


    it('Check all the ride logs', (done) => {
        request(app)
        .get(`/v1/logs/rides`)
        .set("x-access-token", adminToken)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            done();
        });
    });


    it('Check specific ride(log)', (done) => {
        request(app)
        .get(`/v1/logs/ride/ride_9309a162-4fe6-47d4-92d1-f4f89ed44933`)
        .set("x-access-token", adminToken)
        .end((err, res) => {
            res.body.should.be.a('object');
            res.body.should.have.property('ride');
            done();
        });
    });


    it('Check specific ride(log) that doesnt exist', (done) => {
        request(app)
        .get(`/v1/logs/ride/FailNotWork`)
        .set("x-access-token", adminToken)
        .end((err, res) => {
            res.should.have.status(404);
            res.body.should.have.property('message', 'Ride not found');
            done();
        });
    });


// GETTHING ALL THE STATION STUFF FOR THE BIKES / GETTING ALL THE BIKES


    it('Getting all the scooters that are charging', (done) => {
        request(app)
        .get('/v1/scooters/charging')
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(200);
            done();
        });
    });



    it('Getting all the scooters that are Available', (done) => {
        request(app)
        .get('/v1/scooters/available')
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(200);
            done();
        });
    });



    it('Getting all the scooters', (done) => {
        request(app)
        .get('/v1/scooters')
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(200);
            done();
        });
    });


    it('Check for scooters in a city ', (done) => {
        request(app)
        .get(`/v1/scooters/city/694439f73e39c95b79800faa`)
        .set("x-access-token", adminToken)
        .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('array');
            done();
        });
    });


    it('Check for scooters in a city [FAIL] Catch error', (done) => {
        request(app)
        .get(`/v1/scooters/city/testFail`)
        .set("x-access-token", adminToken)
        .end((err, res) => {
            res.should.have.status(500);
            done();
        });
    });



    it('Check for scooters in a city [FAIL]', (done) => {
        request(app)
        .get(`/v1/scooters/city/794439f73a39c96b79800faa`)
        .set("x-access-token", adminToken)
        .end((err, res) => {
            res.should.have.status(404);
            res.body.should.have.property('message', 'Station not found');
            done();
        });
    });





    //Laddning stationer


    it('Check for scooters in a city [FAIL]', (done) => {
        request(app)
        .get(`/v1/charging/stations`)
        .set("x-access-token", adminToken)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            done();
        });
    });


    it('An Admin putting a bike at a charge station', (done) => {
        request(app)
        .post(`/v1/charging/scooter/SCOOTER-003/charge`)
        .set("x-access-token", adminToken)
        .send({ station: '693ac21a46fccbbb6dab4b35' })
        .end((err, res) => {
            res.body.should.have.property('message', 'Bike parked successfully');
            done();
        });
    });


    it('An Admin putting a bike at a charge station its already in that zone', (done) => {
        request(app)
        .post(`/v1/charging/scooter/SCOOTER-003/charge`)
        .set("x-access-token", adminToken)
        .send({ station: '693ac21a46fccbbb6dab4b35' })
        .end((err, res) => {
            res.body.should.have.property('message', 'Bike parked successfully');
            done();
        });
    });


    //FAILING
    it('An Admin putting a bike at a charge station [FAIL] scooter not found', (done) => {
        request(app)
        .post(`/v1/charging/scooter/NOT-WORKING-SCOOTER/charge`)
        .set("x-access-token", adminToken)
        .send({ station: '693ac21a46fccbbb6dab4b35' })
        .end((err, res) => {
            res.should.have.status(404);
            res.body.should.have.property('message', 'Scooter not found');
            done();
        });
    });


    it('An Admin putting a bike at a charge station [FAIL] station not found', (done) => {
        request(app)
        .post(`/v1/charging/scooter/SCOOTER-003/charge`)
        .set("x-access-token", adminToken)
        .send({ station: '796ac21a46fccbbb6dab4b35' })
        .end((err, res) => {
            res.should.have.status(404);
            res.body.should.have.property('message', 'Station not found');
            done();
        });
    });




    //REMOVING FROM STATION

    it('Removing a scooter for charge station', (done) => {
        request(app)
        .post(`/v1/charging/scooter/SCOOTER-003/uncharge`)
        .set("x-access-token", adminToken)
        .send({ station: '693ac21a46fccbbb6dab4b35' })
        .end((err, res) => {
            res.body.should.have.property('message', 'Bike removed from station successfully');
            done();
        });
    });

    






    //Parkering stationer

    it('Get all Parking stations', (done) => {
        request(app)
        .get(`/v1/parking/stations`)
        .set("x-access-token", adminToken)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('array');
            done();
        });
    });


    //Specific city

    it('Get all stations in a city', (done) => {
        request(app)
        .get(`/v1/parking/stations/get/Stockholm`)
        .set("x-access-token", adminToken)
        .end((err, res) => {
            res.body.should.be.a('array');
            done();
        });
    });


    it('An Admin putting a bike at a Parking station', (done) => {
        request(app)
        .post(`/v1/parking/scooter/SCOOTER-003/park`)
        .set("x-access-token", adminToken)
        .send({ station: '694439f73e39c95b79800fa6' })
        .end((err, res) => {
            res.body.should.have.property('message', 'Bike parked successfully');
            done();
        });
    });



    it('An Admin putting a bike at a Parking station', (done) => {
        request(app)
        .post(`/v1/parking/scooter/SCOOT-007/park`)
        .set("x-access-token", adminToken)
        .send({ station: '694439f73e39c95b79800fa6' })
        .end((err, res) => {
            res.body.should.have.property('message', 'Bike parked successfully');
            done();
        });
    });



    it('An Admin putting a bike at a Parking station its already in', (done) => {
        request(app)
        .post(`/v1/parking/scooter/SCOOTER-003/park`)
        .set("x-access-token", adminToken)
        .send({ station: '694439f73e39c95b79800fa6' })
        .end((err, res) => {
            res.body.should.have.property('message', 'Bike parked successfully');
            done();
        });
    });


    //FAILING
    it('An Admin putting a bike at a Parking station [FAIL] scooter not found', (done) => {
        request(app)
        .post(`/v1/parking/scooter/NOT-WORKING-SCOOTER/park`)
        .set("x-access-token", adminToken)
        .send({ station: '794439f73e39c95b79800fa6' })
        .end((err, res) => {
            res.should.have.status(404);
            res.body.should.have.property('message', 'Scooter not found');
            done();
        });
    });


    it('An Admin putting a bike at a Parking station [FAIL] station not found', (done) => {
        request(app)
        .post(`/v1/parking/scooter/SCOOTER-003/park`)
        .set("x-access-token", adminToken)
        .send({ station: '794439f73e39c95b79800fa6' })
        .end((err, res) => {
            res.should.have.status(404);
            res.body.should.have.property('message', 'Station not found');
            done();
        });
    });


    //REMOVING FROM STATION

    it('Removing a scooter for charge station', (done) => {
        request(app)
        .post(`/v1/parking/scooter/SCOOTER-003/unpark`)
        .set("x-access-token", adminToken)
        .send({ station: '694439f73e39c95b79800fa6' })
        .end((err, res) => {
            res.body.should.have.property('message', 'Bike removed from station successfully');
            done();
        });
    });







    //CHANGE ROLE (ROLE) ON ACCOUNT

    it('Changing the role on an account', (done) => {
        request(app)
        .patch(`/v1/user/role/${accountUserObjectId}`)
        .set('x-access-token', adminToken)
        .send({ role: 'admin' })
        .end((err, res) => {
                res.body.should.have.property('ok', true);
            done();
        });
    });



    it('Failing to change the role on an account [FAIL] Wrong id', (done) => {
        request(app)
        .patch(`/v1/user/role/${accountUserId}`)
        .set('x-access-token', adminToken)
        .send({ role: 'admin' })
        .end((err, res) => {
                res.should.have.status(400);
            done();
        });
    });



    //DELETING ACCOUNT (DELETE)
    it('Failing to change the role on an account [FAIL] Wrong id', (done) => {
        request(app)
        .delete(`/v1/user/delete/${accountUserId}`)
        .set('x-access-token', adminToken)
        .send({ role: 'admin' })
        .end((err, res) => {
                res.should.have.status(400);
            done();
        });
    });

    it('Deleting an account', (done) => {
        request(app)
        .delete(`/v1/user/delete/${accountUserObjectId}`)
        .set('x-access-token', adminToken)
        .send({ role: 'admin' })
        .end((err, res) => {
                res.body.should.have.property('ok', true);
            done();
        });
    });



});








describe.only('Failing a log in', () => {

    it('Failing to log into an account [FAIL] Wrong info', (done) => {
        request(app)
        .post('/v1/login')
        .send({ email: 'fail', password: 'fail' })
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(401);
            done();
        });
    });
});








// NEW ACCOUNT ------------------- (ACCOUNT 2)





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
                secondToken = res.body.token;
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


    //Subscription stuff

    it('Get subscription stuff', (done) => {
        request(app)
        .get('/v1/user/subscription')
        .set("x-access-token", secondToken)
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(200);
            done();
        });
    });


    it('Start a subscription', (done) => {
        request(app)
        .post('/v1/user/subscription/start')
        .set("x-access-token", secondToken)
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(200);
            done();
        });
    });


    it('Cancel our subscription', (done) => {
        request(app)
        .put('/v1/user/subscription/cancel')
        .set("x-access-token", secondToken)
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(200);
            done();
        });
    });


    it('Re start our subscription', (done) => {
        request(app)
        .post('/v1/user/subscription/reactivate')
        .set("x-access-token", secondToken)
        .end((err, res) => {
            if (err) return done(err);
                res.should.have.status(200);
            done();
        });
    });

});


