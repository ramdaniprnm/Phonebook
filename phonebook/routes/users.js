var express = require('express');
var router = express.Router();
const { Phonebook } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

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

const avatarValidation = async (req, res, next) => {
  const allowedFiles = /(\.jpg|\.jpeg|\.png|\.gif)$/i;
  try {
    const getData = await Phonebook.findByPk(id);
    if (getData === null || !id || (id && id.trim() === '' || id && isNaN(id) || id && !getData)) {
      throw new Error('Not found');
    }
    if (!req.files || Object.keys(req.files).length === 0 || !req.files.avatar) {
      throw new Error('No files were uploaded');
    }
    if (!allowedExtensions.exec(req.files.avatar.name)) {
      throw new Error('File must be an image');
    }
    next();
  } catch (error) {
    if (error.message === 'Not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
};

router.post('/', avatarValidation, async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const defaultAvatarFile = 'default.png'
    const defaultAvatarPath = path.join(__dirname, '../public/images', defaultAvatarFile);
    const users = await Phonebook.create({ name, phone, avatar: defaultAvatarFile });
    const uploadDir = path.join(__dirname, '../public/images', users.id.toString());
    const uploadPath = path.join(uploadDir, defaultAvatarFile);

    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    fs.copyFileSync(defaultAvatarPath, uploadPath);
    await sharp(defaultAvatarPath).resize(250, 256).toFormat('jpeg, png, jpg').toFile(uploadPath);
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

router.put('/:id/avatar', async function (req, res, next) {
  try {
    const { id } = req.params;
    const avatarFile = req.files.avatar;
    const fileName = `${id}${moment().format('YYYYMMDDHHmmss')}_avatar.jpg`;
    const uploadDir = path.join(__dirname, '../public/images', id.toString());
    const uploadPath = path.join(uploadDir, `${fileName}`);
    const oldAvatarPath = await Phonebook.findByPk(id);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir); {
      if (oldAvatarPath.avatar) {
        fs.unlinkSync(path.join(uploadDir, oldAvatarPath.avatar));
      }
      fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(uploadPath, avatarFile.buffer);
    }
    avatarFile.mv(uploadPath)
    const users = await Phonebook.update({
      avatar: fileName,
    }, {
      where: {
        id: id
      }
    }, {
      returning: true,
      plain: true
    })
    if (users[0] === 0) {
      res.status(400).json({ error: 'User not found' });
    } else {
      res.status(201).json(users[1]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.delete('/:id', async function (req, res, next) {
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
      res.status(400).json({ error: 'User not found' });
    } else {
      if (fs.existsSync(avatarPath)) fs.rmSync(avatarPath);
      res.status(200).json(data)
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
