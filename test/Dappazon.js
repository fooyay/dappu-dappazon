const { expect } = require("chai")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

// global constants for listing an item
const ID = 1
const NAME = "Shoes"
const CATEGORY = "Clothing"
const IMAGE = "https://ipfs.io/ipfs/QmTYEboq8raiBs7GTUg2yLXB3PMz6HuBNgNfSZBx5Msztg/shoes.jpg"
const COST = tokens(1)
const RATING = 4
const STOCK = 5

describe("Dappazon", () => {
  let dappazon
  let deployer, buyer

  beforeEach(async () => {
    // Setup accounts
    [deployer, buyer] = await ethers.getSigners()

    // Deploy Dappazon Contract
    const Dappazon = await ethers.getContractFactory("Dappazon")
    dappazon = await Dappazon.deploy()
  })

  describe("Deployment", () => {
    it("Sets the owner", async () => {
      expect(await dappazon.owner()).to.equal(deployer.address)
    })


  })

  describe("Listing", () => {
    let transaction

    beforeEach(async () => {
      transaction = await dappazon.connect(deployer).list(
        ID,
        NAME,
        CATEGORY,
        IMAGE,
        COST,
        RATING,
        STOCK
      )
      await transaction.wait()
    })

    it("Returns item attributes after listing", async () => {
      const item = await dappazon.items(ID)
      expect(item.id).to.equal(ID)
      expect(item.name).to.equal(NAME)
      expect(item.category).to.equal(CATEGORY)
      expect(item.image).to.equal(IMAGE)
      expect(item.cost).to.equal(COST)
      expect(item.rating).to.equal(RATING)
      expect(item.stock).to.equal(STOCK)
    })

    it("Emits Listed event after listing", () => {
      expect(transaction).to.emit(dappazon, "Listed").withArgs(
        ID,
        NAME,
        CATEGORY,
        IMAGE,
        COST,
        RATING,
        STOCK
      )
    })
  })

  describe("onlyOwner Modifier", () => {
    it("Allows owner to list items", async () => {
      await expect(
        dappazon.connect(deployer).list(
          ID,
          NAME,
          CATEGORY,
          IMAGE,
          COST,
          RATING,
          STOCK
        )
      ).to.not.be.reverted
    })

    it("Reverts when non-owner tries to list items", async () => {
      await expect(
        dappazon.connect(buyer).list(
          ID,
          NAME,
          CATEGORY,
          IMAGE,
          COST,
          RATING,
          STOCK
        )
      ).to.be.revertedWith("Only owner can call this function")
    })
  })

  describe("Buying", () => {
    let transaction

    beforeEach(async () => {
      // List item first
      transaction = await dappazon.connect(deployer).list(
        ID,
        NAME,
        CATEGORY,
        IMAGE,
        COST,
        RATING,
        STOCK
      )
      await transaction.wait()

      // Buy item
      transaction = await dappazon.connect(buyer).buy(ID, { value: COST })
      await transaction.wait()
    })

    it("Updates buyer's order count", async () => {
      const result = await dappazon.orderCount(buyer.address)
      expect(result).to.equal(1)
    })

    it("Adds the order to buyer's orders", async () => {
      const order = await dappazon.orders(buyer.address, 1)
      expect(order.time).to.be.greaterThan(0)
      expect(order.item.id).to.equal(ID)
      expect(order.item.name).to.equal(NAME)
    })

    it("Updates the contract balance", async () => {
      const result = await ethers.provider.getBalance(dappazon.address)
      expect(result).to.equal(COST)
    })

    it("Emits Bought event after buying", () => {
      expect(transaction).to.emit(dappazon, "Bought").withArgs(
        buyer.address,
        1,
        ID
      )
    })
  })

  describe("Withdrawing", () => {
    let transaction

    beforeEach(async () => {
      // List item first
      transaction = await dappazon.connect(deployer).list(
        ID,
        NAME,
        CATEGORY,
        IMAGE,
        COST,
        RATING,
        STOCK
      )
      await transaction.wait()

      // Buy item
      transaction = await dappazon.connect(buyer).buy(ID, { value: COST })
      await transaction.wait()
    

      //Get Deployer balance before withdrawing
      balanceBefore = await ethers.provider.getBalance(deployer.address)

      // Withdraw funds
      transaction = await dappazon.connect(deployer).withdraw()
      await transaction.wait()
    })

    it("Updates the owner balance after withdrawing", async () => {
      const balanceAfter = await ethers.provider.getBalance(deployer.address)
      expect(balanceAfter).to.be.greaterThan(balanceBefore)
    })

    it("Updates the contract balance to zero after withdrawing", async () => {
      const result = await ethers.provider.getBalance(dappazon.address)
      expect(result).to.equal(0)
    })

    it("Reverts when non-owner tries to withdraw", async () => {
      await expect(
        dappazon.connect(buyer).withdraw()
      ).to.be.revertedWith("Only owner can call this function")
    })
  })
})
