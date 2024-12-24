var express = require('express');
var router = express.Router();
const { Phonebook } = require('../models');
const { Op } = require('sequelize');

/* GET user listing. */
router.get('/', async function (req, res) {

  try {
    const { page = '1', limit = '10', keyword = '', sort = 'asc' } = req.query;
    const { count, rows } = await Phonebook.findAndCountAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${keyword}%` } },
          { phone: { [Op.like]: `%${keyword}%` } }
        ]
      },
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['name', sort]]
    });

    res.status(200).json({
      phonebook: rows,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / limit),
      total: parseInt(count)
    });
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
