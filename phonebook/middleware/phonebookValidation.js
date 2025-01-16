const { phonebook } = require('../models/phonebook')

const addPhonebookValidation = async (req, res, next) => {
    const { name, phone } = req.body;
    try {
        if ((!name && !phone) || (name && name.trim() === '' && phone && phone.trim() === '')) {
            throw new Error('Name and phone are required');
        }
        if (!name || (!name && name.trim() === '')) {
            throw new Error('Name is required');
        }
        if (!phone || (!phone && phone.trim() === '')) {
            throw new Error('Phone is required');
        }
        next()
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updatePhonebookValidation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, phone } = req.body;
        const getData = await phonebook.findByPk(id);
        if (!getData === null || !id || (id && id.trim() === '' || id && isNaN(id) || id && !getData)) {
            throw new Error('User not found');
        }
        if (!name && !phone) {
            throw new error('Name and phone are required');
        }
        if (!name || !phone) {
            return res.status(400).json({ error: 'Name and phone are required' });
        }
        if (!name.trim() || !phone.trim()) {
            return res.status(400).json({ error: 'Name and phone cannot be empty' });
        }
        next()
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updatePhonebookAvatarValidation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const avatar = req.file;

        // Validate ID
        if (!id || id.trim() === '' || isNaN(id)) {
            throw new Error('Invalid user ID');
        }

        // Validate avatar
        if (!avatar) {
            throw new Error('Avatar is required');
        }

        // Check if user exists (assuming getData is a function that fetches user data)
        const getData = await getUserDataById(id);
        if (!getData) {
            throw new Error('User not found');
        }

        next();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = { addPhonebookValidation, updatePhonebookValidation, updatePhonebookAvatarValidation } 