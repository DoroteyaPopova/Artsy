const express = require("express");
const router = express.Router();
// const productsController = require("../controllers/products.controller.js")
const {getAllProducts, getSingleProduct, addProduct, updateProduct, deleteProduct} = require("../controllers/products.controller.js")

// router.get('/', productsController.getAllProducts)
// router.get('/:id', productsController.getSingleProduct)
// router.post('/', productsController.addProduct)
// router.put('/:id', productsController.updateProduct)
// router.delete('/:id', productsController.deleteProduct)


router.get('/', getAllProducts)
router.get('/:id', getSingleProduct)
router.post('/', addProduct)
router.put('/:id', updateProduct)
router.delete('/:id', deleteProduct)

module.exports = router;