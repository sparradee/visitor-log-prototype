const app = require('express')()
const { body, validationResult } = require('express-validator')
const { Model: Visitor } = require('./schemas/visitor')

/**
 * @todo
 * @middleware
 * Validate all API calls before allowing access.
 */
app.all('/api/*', (req, res, next) => {
  // @todo verify it's only from the local server
  next()
})

/**
 * @middleware
 * Check that the results of the validation middleware hasn't thrown any errors.
 *
 * @param {object} req Express request object
 * @param {object} res Express response object
 * @param {function} next Express middleware function
 */
const checkValidation = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const msg = Object.values(errors.mapped())
      .map((err) => err.msg)
      .join(', ')
    next(msg)
    return res.status(400).send({ msg })
  }
  next()
}

/**
 * @async
 * Is there already a record with the given values?
 *
 * @param {object} data
 * @param {string} data.name
 * @param {string} data.company
 * @returns {boolean}
 */
const visitorAlreadyExists = async (data = {}) => {
  let results
  try {
    results = await Visitor.findOne(data).exec()
  } catch (err) {
    throw err
  }
  return !!results
}

app
  .route('/api/visitor/:id?')
  .all((req, res, next) => {
    req._id = req.params.id || null
    next()
  })
  .get(async (req, res) => {
    const query = req._id ? { _id: req._id } : {}
    let response
    try {
      response = await Visitor.find(query).sort({ createdOn: -1 }).exec()
    } catch (err) {
      return res.status(500).send({ msg: 'Error querying database' })
    }
    if ((!response || !response.length) && req._id) {
      return res.status(404).send({ msg: `Visitor ${req._id} not found` })
    }
    return res.status(200).send(req._id ? response[0] : response)
  })
  .post(
    body('name', 'Name is required').exists({ checkNull: true }).notEmpty().trim().escape(),
    body('company', 'Company is required').exists({ checkNull: true }).notEmpty().trim().escape(),
    checkValidation,
    async (req, res) => {
      if (req._id) {
        return res.status(400).send({ msg: 'Cannot process with a submitted id' })
      }
      const data = req.body

      if (await visitorAlreadyExists(data)) {
        return res.status(400).send({ msg: 'A visitor with those values is already registered' })
      }

      let results
      try {
        results = await Visitor.create(data)
      } catch (err) {
        return res.status(500).send({ msg: err })
      }
      return res.status(200).send({ msg: 'Visitor Created', results })
    }
  )
  .put(body('name').trim().escape(), body('company').trim().escape(), async (req, res) => {
    if (!req._id) {
      return res.status(400).send({ msg: 'Missing Visitor id' })
    }
    const data = req.body
    data.updatedOn = new Date()

    let results
    try {
      results = await Visitor.updateOne({ _id: req._id }, { $set: data })
    } catch (err) {
      return res.status(500).send({ msg: err })
    }
    if (results && results.modifiedCount) {
      return res.status(200).send({ msg: 'Visitor Updated' })
    }
    return res.status(404).send({ msg: `Visitor ${req._id} not found` })
  })
  .delete(async (req, res) => {
    if (!req._id) {
      return res.status(500).send({ msg: 'Invalid id' })
    }
    let response
    try {
      response = await Visitor.deleteOne({ _id: req._id })
    } catch (err) {
      return res.status(500).send({ msg: `Error deleting record :: ${err.message}` })
    }
    if (!response || !response.deletedCount) {
      return res.status(400).send({ msg: 'Nothing was deleted' })
    }
    return res.status(200).send({ msg: 'Visitor Deleted' })
  })

module.exports = app
