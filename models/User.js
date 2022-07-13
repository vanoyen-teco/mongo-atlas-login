require('dotenv/config');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

mongoose.connect(process.env.ATLAS_CNX,{
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, 'name is required']
    },
    email: {
        type: String,
        required: [true, 'email is required'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'password is required'],
    }
});

// helpful functions: encrypt pass
UserSchema.pre("save", function (next) {
    if (!this.isModified("password")){
        return next();
    }else{
        this.password = bcrypt.hashSync(this.password, 10);
        return next();
    }    
})
// helpful functions: compare pass
UserSchema.methods.comparePassword = (password, hash) => {
    let comp = bcrypt.compareSync(password, hash)
    return comp;
}

module.exports = mongoose.model('User', UserSchema);
