// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Turing is ERC20{
    address private deployer;
    address private teacherAddress = 0x502542668aF09fa7aea52174b9965A7799343Df7;

    bool private voting = false;

    string[] public codenames;

    /**
     * @dev Struct de candidatos com address e opção de voto, caso tenha votado
     */
    struct Candidate {
        address candidateAddress;
        mapping(address => bool) votedBy;
    }

    /**
     * @dev Mapeia os codinomes para os candidatos
     */
    mapping(string => Candidate) authorizedUsers;

    event Vote(string from, string to, uint256 value);
    event IssueToken(string to, uint256 amount);

    constructor() ERC20("Turing", "TTK"){
        deployer = msg.sender;

        string[19] memory candidateCodename = [
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

        address[19] memory candidateAddresses = [
            0x70997970C51812dc3A010C7d01b50e0d17dc79C8,
            0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC,
            0x90F79bf6EB2c4f870365E785982E1f101E93b906,
            0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65,
            0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc,
            0x976EA74026E726554dB657fA54763abd0C3a0aa9,
            0x14dC79964da2C08b23698B3D3cc7Ca32193d9955,
            0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f,
            0xa0Ee7A142d267C1f36714E4a8F75612F20a79720,
            0xBcd4042DE499D14e55001CcbB24a551F3b954096,
            0x71bE63f3384f5fb98995898A86B02Fb2426c5788,
            0xFABB0ac9d68B0B445fB7357272Ff202C5651694a,
            0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec,
            0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097,
            0xcd3B766CCDd6AE721141F452C550Ca635964ce71,
            0x2546BcD3c84621e976D8185a91A922aE77ECEc30,
            0xbDA5747bFD65F08deb54cb465eB87D40e51B197E,
            0xdD2FD4581271e230360230F9337D5c0430Bf44C0,
            0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199
        ];

        for(uint i = 0; i < candidateCodename.length; i++){
            Candidate storage c = authorizedUsers[candidateCodename[i]];
            c.candidateAddress = candidateAddresses[i];
            codenames.push(candidateCodename[i]);
        }
        
    }

    function getCodenames() public view returns(string memory) {
        string memory result = codenames[0]; // Começa com a primeira string

        for (uint256 i = 1; i < codenames.length; i++) {
            result = string(abi.encodePacked(result, ";", codenames[i]));
        }

        return result;
    }

    function getRanking() public view returns(string memory) {
        string memory result = "";

        for (uint256 i = 0; i < codenames.length; i++) {
            Candidate storage c = authorizedUsers[codenames[i]];
            // Cria "Murilo-10;Joao-14;...."
            result = string(abi.encodePacked(result, codenames[i], "-", uint2str(balanceOf(c.candidateAddress)), ";"));
        }

        return result;
    }

    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        while (_i != 0) {
            bstr[--length] = bytes1(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
    }

    function votingOn() public {
        require(msg.sender == deployer || msg.sender == teacherAddress, "Unauthenticated!");
        voting = true;
    }

    function votingOff() public {
        require(msg.sender == deployer || msg.sender == teacherAddress, "Unauthenticated!");
        voting = false;
    }

    function getVotingStatus() public view returns (bool) {
        return voting;
    }

    function issueToken(string calldata receiver, uint256 amount) public{
        require(msg.sender == deployer || msg.sender == teacherAddress, "Unauthenticated!");

        Candidate storage c = authorizedUsers[receiver];

        _mint(c.candidateAddress, amount);

        emit IssueToken(receiver, amount);
    }

    function vote(string calldata receiver, uint256 amount) public {
        require(msg.sender != deployer && msg.sender != teacherAddress, "Unauthorized");
        require(voting == true, "You can't vote now");
        require(amount <= 2000000000000000000, "You must send a lower amount");
        
        Candidate storage c = authorizedUsers[receiver];

        require(c.candidateAddress != address(0), "Unknown candidate");
        require(msg.sender != c.candidateAddress, "You can't vote for yourself");
        require(c.votedBy[msg.sender] == false, "You can't vote for the same candidate twice");
        require(balanceOf(msg.sender) >= amount, "You don't have enough balance");

        // Faz a transferência
        _transfer(msg.sender, c.candidateAddress, amount);

        // Recompensa de quem votou 0,2 Turings
        _mint(msg.sender, 200000000000000000);

        // Marca que receiver foi votado pelo sender
        c.votedBy[msg.sender] = true;
    }



}
