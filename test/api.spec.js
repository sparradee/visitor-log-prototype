const chai = require('chai')
const chaiHttp = require('chai-http')
const app = require('express')()
const api = require('../src/api')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const { Model: Visitor } = require('../src/schemas/visitor')
const bodyParser = require('body-parser')

app.use(bodyParser.json(), api)
chai.use(chaiHttp)
const expect = chai.expect

describe('Setting up the test environment', () => {
  let mongoServer

  before(async () => {
    mongoServer = await MongoMemoryServer.create()
    await mongoose.connect(mongoServer.getUri(), { dbName: 'fake' })
  })

  after(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
  })

  it('should verify memory server connection', async () => {
    const results = await Visitor.find().exec()
    expect(results).to.exist.and.be.an('array').with.lengthOf(0)
  })

  describe('Testing the API', () => {
    it('should retrieve an empty list of visitors', (done) => {
      chai
        .request(app)
        .get('/api/visitor')
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res.body).to.be.an('array').with.lengthOf(0)
          done()
        })
    })

    const firstVisitor = { name: 'First Visitor', company: 'First Company' }

    it('should add a new visitor', (done) => {
      chai
        .request(app)
        .post('/api/visitor')
        .send(firstVisitor)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res.body.results).to.be.an('object')
          expect(res.body.results.name).to.exist.and.equal(firstVisitor.name)
          expect(res.body.results.company).to.exist.and.equal(firstVisitor.company)
          expect(res.body.results.createdOn).to.exist.and.be.a('string')
          done()
        })
    })

    it('should retrieve a list of one visitor', (done) => {
      chai
        .request(app)
        .get('/api/visitor')
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res.body).to.be.an('array').with.lengthOf(1)

          const visitor = res.body[0]
          expect(visitor.name).to.exist.and.equal(firstVisitor.name)
          expect(visitor.company).to.exist.and.equal(firstVisitor.company)
          done()
        })
    })

    it('should fail to send a duplicate visitor', (done) => {
      chai
        .request(app)
        .post('/api/visitor')
        .send(firstVisitor)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(400)
          expect(res.body).to.be.an('object').with.property('msg')
          done()
        })
    })

    const secondVisitor = { name: 'Second Visitor', company: 'First Company' }
    let secondVisitorId = null

    it('should add a second visitor', (done) => {
      chai
        .request(app)
        .post('/api/visitor')
        .send(secondVisitor)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res.body.results).to.be.an('object')
          expect(res.body.results.name).to.exist.and.equal(secondVisitor.name)
          expect(res.body.results.company).to.exist.and.equal(secondVisitor.company)
          expect(res.body.results.createdOn).to.exist.and.be.a('string')
          secondVisitorId = res.body.results._id
          expect(secondVisitorId).to.not.be.null
          done()
        })
    })

    const newSecondVistor = { name: 'Updated Second Visitor', company: 'Second Company' }

    it('should update the second visitor', (done) => {
      chai
        .request(app)
        .put(`/api/visitor/${secondVisitorId}`)
        .send(newSecondVistor)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res.body).to.be.an('object').with.property('msg')
          done()
        })
    })

    it('should fetch the updated second visitor by id', (done) => {
      chai
        .request(app)
        .get(`/api/visitor/${secondVisitorId}`)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res.body).to.be.an('object')
          expect(res.body.name).to.exist.and.equal(newSecondVistor.name)
          expect(res.body.company).to.exist.and.equal(newSecondVistor.company)
          done()
        })
    })

    it('should delete the second visitor', (done) => {
      chai
        .request(app)
        .delete(`/api/visitor/${secondVisitorId}`)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res.body).to.be.an('object').with.property('msg')
          done()
        })
    })

    it('should fail to fetch the second visitor by id', (done) => {
      chai
        .request(app)
        .get(`/api/visitor/${secondVisitorId}`)
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(404)
          expect(res.body).to.be.an('object').with.property('msg')
          done()
        })
    })

    it('should fail to updated the second visitor', (done) => {
      chai
        .request(app)
        .put(`/api/visitor/${secondVisitorId}`)
        .send(secondVisitor) // Theoretically reverting the changes
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(404)
          expect(res.body).to.be.an('object').with.property('msg')
          done()
        })
    })

    it('should retrieve a list of the one remaining visitor', (done) => {
      chai
        .request(app)
        .get('/api/visitor')
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res.body).to.be.an('array').with.lengthOf(1)

          const visitor = res.body[0]
          expect(visitor.name).to.exist.and.equal(firstVisitor.name)
          expect(visitor.company).to.exist.and.equal(firstVisitor.company)
          done()
        })
    })
  })
})
