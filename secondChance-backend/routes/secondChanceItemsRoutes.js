const express = require('express')
const multer = require('multer')
const router = express.Router()
const connectToDatabase = require('../models/db')
const logger = require('../logger')

// Define the upload directory path
const directoryPath = 'public/images'

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath) // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) // Use the original file name
  }
})

const upload = multer({ storage: storage })

const collectionName = 'secondChanceItems'

// Get all secondChanceItems
router.get('/', async (req, res, next) => {
  logger.info('/ called')
  try {
    // Step 2: task 1 - Retrieve the database connection from db.js and store the connection to db constant
    const db = await connectToDatabase()

    // Step 2: task 2 - Use the collection() method to retrieve the secondChanceItems collection
    const collection = db.collection(collectionName)

    // Step 2: task 3 - Fetch all secondChanceItems using the collection.find() method. Chain it with the toArray() method to convert to a JSON array
    const secondChanceItems = await collection.find({}).toArray()

    // Step 2: task 4 - Return the secondChanceItems using the res.json() method
    res.json(secondChanceItems)
  } catch (e) {
    logger.console.error('oops something went wrong', e)
    next(e)
  }
})

// Add a new item
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    // Step 3: task 1 - Retrieve the database connection from db.js and store the connection to db constant
    const db = await connectToDatabase()

    // Step 3: task 2 - Use the collection() method to retrieve the secondChanceItems collection
    const collection = await db.collection(collectionName)

    // Step 3: task 3 - Create a new secondChanceItem from the request body
    let newItem = req.body
    console.log(newItem)

    // Step 3: task 4 - Get the last id, increment it by 1, and set it to the new secondChanceItem
    const lastItem = collection.find().sort({ id: -1 }).limit(1)
    await lastItem.forEach(item => {
      newItem.id = (parseInt(item.id) + 1).toString()
    })
    // Step 3: task 5 - Set the current date to the new item
    const dateAdded = Math.floor(new Date().getTime() / 1000)
    newItem.date_added = dateAdded

    // Task 6: Add the secondChanceItem to the database
    newItem = await collection.insertOne(newItem)

    res.status(201).json(newItem)
  } catch (e) {
    next(e)
  }
})

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    // Task 1: Retrieve the database connection from db.js and store the connection in the db constant
    const db = await connectToDatabase()

    // Task 2: Use the collection() method to retrieve the secondChanceItems collection
    const collection = await db.collection(collectionName)

    // Task 3: Find a specific secondChanceItem by its ID using the collection.fineOne() method. Store it in a constant called secondChanceItem
    const secondChanceItem = await collection.findOne({ id: id })

    // Task 4: Return the secondChanceItem as a JSON object. Return an error message if the item is not found
    if (!secondChanceItem) return res.status(404).json('Item not found.')
    res.json(secondChanceItem)
  } catch (e) {
    next(e)
  }
})

// Update and existing item
router.put('/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    // Task 1: Retrieve the dtabase connection from db.js and store the connection to a db constant
    const db = await connectToDatabase()

    // Task 2: Use the collection() method to retrieve the secondChanceItems collection
    const collection = await db.collection(collectionName)

    // Task 3: Check if the secondChanceItem exists and send an appropriate message if it doesn't exist
    const item = await collection.findOne({ id: id })

    if (!item) {
      return res.status(404).json('Item not found.')
    }

    // Task 4: Update the item's attributes
    item.category = req.body.category
    item.condition = req.body.condition
    item.age_days = req.body.age_days
    item.description = req.body.description
    item.age_years = Number((req.body.age_days / 365).toFixed(1))
    item.updatedAt = new Date()

    const updatedItem = await collection.findOneAndUpdate(
      { id: id },
      { $set: item },
      { returnDocument: 'after' }
    )

    // Task 5: Send confirmation
    if (updatedItem) {
      res.json({ uploaded: 'success' })
    } else {
      res.json({ uploaded: 'failed' })
    }
  } catch (e) {
    next(e)
  }
})

// Delete an existing item
router.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id

    // Task 1: Retrieve the database connection from db.js and store the connection to the db constant
    const db = await connectToDatabase()

    // Task 2: Use the collection() method to retrieve the secondChanceItem collection
    const collection = await db.collection(collectionName)

    // Task 3: Find a specific secondChanceItem by ID using the collection.fineOne() method and send an appropriate message if it doesn't exist
    const item = await collection.findOne({ id: id })
    if (!item) {
      logger.error('secondChanceItem not found')
      return res.status(404).json({ error: 'secondChanceItem not found' })
    }

    // Task 4: Delete the object and send an appropriate message
    await collection.deleteOne(item)
    res.json({ deleted: 'success' })
  } catch (e) {
    next(e)
  }
})

module.exports = router
