// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleToken
 * @dev Basic ERC20 token with 1% transfer tax
 * 50% to creator, 50% accumulated (can be used for buyback later)
 */
contract SimpleToken {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    address public creator;
    
    uint256 public constant TAX_RATE = 100; // 1% in basis points
    uint256 public accumulatedFees;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event TaxCollected(address indexed from, uint256 creatorFee, uint256 burnFee);
    
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _totalSupply,
        address _creator
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply;
        creator = _creator;
        balanceOf[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }
    
    function transfer(address to, uint256 amount) public returns (bool) {
        return _transfer(msg.sender, to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        allowance[from][msg.sender] -= amount;
        return _transfer(from, to, amount);
    }
    
    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function _transfer(address from, address to, uint256 amount) internal returns (bool) {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");
        require(balanceOf[from] >= amount, "Insufficient balance");
        
        // Skip tax for minting
        if (from == address(0)) {
            balanceOf[to] += amount;
            emit Transfer(from, to, amount);
            return true;
        }
        
        // Calculate 1% tax
        uint256 taxAmount = (amount * TAX_RATE) / 10000;
        uint256 afterTax = amount - taxAmount;
        
        if (taxAmount > 0) {
            uint256 creatorFee = taxAmount / 2;
            uint256 burnFee = taxAmount - creatorFee;
            
            // Transfer amounts
            balanceOf[from] -= amount;
            balanceOf[to] += afterTax;
            balanceOf[creator] += creatorFee;
            
            // Accumulate burn fee in contract
            balanceOf[address(this)] += burnFee;
            accumulatedFees += burnFee;
            
            emit Transfer(from, to, afterTax);
            emit Transfer(from, creator, creatorFee);
            emit Transfer(from, address(this), burnFee);
            emit TaxCollected(from, creatorFee, burnFee);
        } else {
            balanceOf[from] -= amount;
            balanceOf[to] += amount;
            emit Transfer(from, to, amount);
        }
        
        return true;
    }
}

