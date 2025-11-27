import User from "../models/User.js"

const registerUser = async (req, res) => {
    const { name, email, password } = req.body
    try {
        const userExist = await User.findOne({ email })
        // בדיקת משתמש קיים
        console.log(userExist)
        if (userExist) return res.status(400).json({ message: "User already exist" })

        const user = await User.create({ name, email, password })
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email
        })
    } catch (err) {
        res.status(500).json({ message: err.message })
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email })

        if (user && password === user.password) {
            res.status(200).json({
                _id: user._id,
                name: user.name,
                email: user.email
            })
        } else {
            res.status(401).json({ message: "Invalid email or password" })
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error: " + error.message })
    }
}

// put - method
const updateUserPut = async (req, res) => {
    try {
        const { id } = req.params
        const { name, email, password } = req.body

        const user = await User.findByIdAndUpdate(id, {
            name,
            email,
            password
        })

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        res.status(200).json({
            name,
            email
        })
    } catch (error) {
        res.status(500).json({ message: "Server Error: " + error.message })
    }
}

// patch - method
const updateUserPatch = async (req, res) => {
    try {

        const { id } = req.params
        const user = await User.findByIdAndUpdate(id, req.body)

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email
        })
    } catch (error) {
        res.status(500).json({ message: "Server Error: " + error.message })
    }
}

// delete - method
const deleteUser = async (req, res) => {
    try {

        const { id } = req.params

        const user = await User.findByIdAndDelete(id)

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        res.status(200).json({
            message: "Success, user deleted!"
        })

    } catch (error) {
        res.status(500).json({ message: "Server Error: " + error.message })
    }
}

const getUsers = async (req, res) => {
    try {

        const users = await User.find()

        if (!users) {
            return res.status(400).json({ message: "Restricted permission" })
        }

        res.status(200).json(users)

    } catch (error) {
        res.status(500).json({ message: "Server Error: " + error.message })
    }
}

const getUserById = async (req, res) => {
    try {
        const { id } = req.params
        const user = await User.findById(id).select('-password')

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        res.status(200).json(user)
    } catch (error) {
        res.status(500).json({ message: "Server Error: " + error.message })
    }
}

export {
    registerUser,
    loginUser,
    updateUserPut,
    updateUserPatch,
    deleteUser,
    getUsers,
    getUserById
}