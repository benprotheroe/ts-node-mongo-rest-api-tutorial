import mongoose from "mongoose";

// User Config
const ListSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    user_id: { type: String, required: true },
    //   authentication: {
    //     password: { type: String, required: true, select: false },
    //     salt: { type: String, select: false },
    //     sessionToken: { type: String, select: false },
    //   },
  },
  {
    timestamps: true,
  }
);

export const ListModel = mongoose.model("List", ListSchema);

// User Actions
export const getList = () => ListModel.find();
// export const getListByEmail = (email: string) => ListModel.find({ email });
// export const getListBySessionToken = (sessionToken: string) => ListModel.findOne({ 'authentication.sessionToken': sessionToken });
export const getListByUserId = (user_id: string) => ListModel.find({ user_id });
export const createItem = (values: Record<string, any>) =>
  new ListModel(values).save().then((item) => item.toObject());

//TODO
// export const deleteItemById = (id: string) => ListModel.findOneAndDelete({ _id: id });
// export const updateItemById = (id: string, values: Record<string, any>) => ListModel.findByIdAndUpdate(id, values);
