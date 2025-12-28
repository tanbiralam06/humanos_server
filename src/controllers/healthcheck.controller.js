import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

/**
const healthCheck = async (req, res, next) => {
    const user = await getUserFromDB()
  try {
    res
      .status(200)
      .json(new ApiResponse(200, { message: "Server is running" }));
  } catch (error) {
    next(err)
  }
};
*/


//if you dont want to use try catch each time then use this another method
const healthCheck = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, { message: "server is running" }));
});

export { healthCheck };
