var express = require('express');
var router = express.Router();
const { Phonebook } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/* GET user listing. */
router.get('/', async (req, res) => {
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
      order: [['name', sort]] // Sort by `name` field (asc or desc)
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

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Phonebook.findByPk(id);
    if (data === null) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(data);
  } catch (error) {  // Added error parameter
    res.status(500).json({ error: error.message });
  }
});

// Add middleware to POST route
router.post('/', async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const defaultAvatarFile = 'default.png';
    const defaultAvatarPath = path.join(__dirname, '../public/images', defaultAvatarFile);
    const users = await Phonebook.create({ name, phone, avatar: defaultAvatarFile });
    const uploadDir = path.join(__dirname, '../public/images', users.id.toString());
    const uploadPath = path.join(uploadDir, defaultAvatarFile);

    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    fs.copyFileSync(defaultAvatarPath, uploadPath);
    await sharp(defaultAvatarPath).resize(250, 256).toFormat('jpeg').toFile(uploadPath);
    res.status(201).json(users)
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add middleware to PUT route
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [updated, data] = await Phonebook.update(
      req.body,
      {
        where: { id },
        returning: true,
        plain: true
      }
    );
    if (updated === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/avatar', async (req, res, next) => {
  try {
    const { id } = req.params;
    const avatarFile = req.files.avatar;
    const fileName = `${id}${moment().format('YYYYMMDDHHmmss')}_avatar.jpg`;
    const uploadDir = path.join(__dirname, '../public/images', id.toString());
    const uploadPath = path.join(uploadDir, fileName);
    const userData = await Phonebook.findByPk(id);

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    if (userData.avatar) {
      const oldAvatarPath = path.join(uploadDir, userData.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    await avatarFile.mv(uploadPath);
    const [updated, data] = await Phonebook.update(
      { avatar: fileName },
      {
        where: { id },
        returning: true,
        plain: true
      }
    );

    if (updated === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await Phonebook.findByPk(id);
    const avatarPath = path.join(__dirname, '../public/images', id.toString());
    const result = await Phonebook.destroy(
      {
        where: {
          id
        }
      }
    );
    if (result === 0) {
      res.status(404).json({ error: 'User not found' });
    } else {
      if (fs.existsSync(avatarPath)) fs.rmSync(avatarPath, { recursive: true });
      res.status(200).json(data)
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
