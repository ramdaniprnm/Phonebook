var express = require('express');
var router = express.Router();
const { Phonebook } = require('../models');

/* GET user listing. */
router.get('/', async function (req, res, next) {
  const { page = '1', limit = '10', keyword = '', sort = 'asc' } = req.query;

  try {
    const users = await Phonebook.findAll({
      limit: Number(limit),
      offset: Number((page - 1) * limit),
      where: {
        name: {
          [sort === 'asc' ? '$like' : '$not like']: `%${keyword}%`
        }
      }
    });
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async function (req, res, next) {
  try {
    const { name, phone, avatar } = req.body;
    const users = await Phonebook.create({ name, phone, avatar });
    res.status(201).json(users)
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async function (req, res, next) {
  try {
    const users = await Phonebook.update(
      req.body,
      {
        where: {
          id: req.params.id
        },
        returning: true,
        plain: true
      },
    );
    res.status(201).json(users)
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/avatar/:id', async function (req, res, next) {
  try {
    const users = await Phonebook.update(
      req.body,
      {
        where: {
          id: req.params.id
        },
        returning: true,
        plain: true
      },
    );
    res.status(201).json(users)
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async function (req, res, next) {
  try {
    const users = await Phonebook.destroy(
      {
        where: {
          id: req.params.id
        }
      }
    );
    res.status(200).json(users)
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
