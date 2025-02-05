// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Turing is ERC20{
    address private deployer;
    address private teacherAddress = 0x502542668aF09fa7aea52174b9965A7799343Df7;

    bool private voting = false;

    /**
     * @dev Struct de candidatos com address e opção de voto, caso tenha votado
     */
    struct Candidate {
        address candidateAddress;
        mapping(address => boolean) votedBy;
    }

    /**
     * @dev Mapeia os codinomes para os candidatos
     */
    mapping(string => Candidate) authorizedUsers;

    constructor() ERC20("Turing", "TTK"){
        deployer = msg.sender;

        uint8 size = 19;

        string[size] candidateCodename = [
            "nome1",
            "nome2",
            "nome3",
            "nome4",
            "nome5",
            "nome6",
            "nome7",
            "nome8",
            "nome9",
            "nome10",
            "nome11",
            "nome12",
            "nome13",
            "nome14",
            "nome15",
            "nome16",
            "nome17",
            "nome18",
            "nome19"
        ];

        address[size] candidateAddresses = [
            0x70997970c51812dc3a010c7d01b50e0d17dc79c8,
            0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc,
            0x90f79bf6eb2c4f870365e785982e1f101e93b906,
            0x15d34aaf54267db7d7c367839aaf71a00a2c6a65,
            0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc,
            0x976ea74026e726554db657fa54763abd0c3a0aa9,
            0x14dc79964da2c08b23698b3d3cc7ca32193d9955,
            0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f,
            0xa0ee7a142d267c1f36714e4a8f75612f20a79720,
            0xbcd4042de499d14e55001ccbb24a551f3b954096,
            0x71be63f3384f5fb98995898a86b02fb2426c5788,
            0xfabb0ac9d68b0b445fb7357272ff202c5651694a,
            0x1cbd3b2770909d4e10f157cabc84c7264073c9ec,
            0xdf3e18d64bc6a983f673ab319ccae4f1a57c7097,
            0xcd3b766ccdd6ae721141f452c550ca635964ce71,
            0x2546bcd3c84621e976d8185a91a922ae77ecec30,
            0xbda5747bfd65f08deb54cb465eb87d40e51b197e,
            0xdd2fd4581271e230360230f9337d5c0430bf44c0,
            0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199
        ];

        for(uint i = 0; i < size; i++){
            Candidate storage c = authorizedUsers[i];
            c.candidateAddress = candidateAddresses[i];
        }
        
    }

    function votingOn(){
        require(msg.sender == deployer || msg.sender == teacherAddress, "Unauthenticated!");
        bool storage voting = true;
    }

    function votingOff(){
        require(msg.sender == deployer || msg.sender == teacherAddress, "Unauthenticated!");
        bool storage voting = false;
    }

    function issueToken(string receiver, uint256 amount) public{
        require(msg.sender == deployer || msg.sender == teacherAddress, "Unauthenticated!");

        Candidate storage c = authorizedUsers(receiver);

        _mint(c.candidateAddress, amount);
    }

    function vote(string receiver, uint8 amount) {
        require(voting == false, "You can't vote now");
        require(amount >= 2, "You must send a lower amount");
        
        Candidate storage c = authorizedUsers(receiver);

        require(msg.sender == c.candidateAddress, "You can't vote for yourself");
        require(c.votedBy[msg.sender] == true, "You can't vote for the same candidate twice");
        require(balanceOf(msg.sender) >= amount, "You don't have enough balance");

        // Faz a transferência
        _mint(c.candidateAddress, amount);
        _burn(msg.sender, amount);

        // Recompensa de quem votou 0,2 Turings
        _mint(msg.sender, 200000000000000000);

        // Marca que receiver foi votado pelo sender
        c.votedBy[msg.sender] = true;



    }
}
