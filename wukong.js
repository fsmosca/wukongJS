/************************************************\
 ================================================
 
                      WUKONG
              javascript chess engine
           
                        by
                        
                 Code Monkey King
 
 ===============================================
\************************************************/

// chess engine version
const VERSION = '1.0';

// chess engine object
var Engine = function(boardSize, lightSquare, darkSquare, selectColor) {

  /****************************\
   ============================
   
         GLOBAL CONSTANTS

   ============================              
  \****************************/
  
  // sides to move  
  const white = 0;
  const black = 1;
  
  // piece encoding  
  const P = 1, N = 2, B = 3, R = 4, Q = 5, K = 6;
  const p = 7, n = 8, b = 9, r = 10, q = 11, k = 12;
  
  // empty square & offboard square
  const e = 0, o = 13;
  
  // square encoding
  const a8 = 0,    b8 = 1,    c8 = 2,   d8 = 3,   e8 = 4,   f8 = 5,   g8 = 6,   h8 = 7;
  const a7 = 16,   b7 = 17,   c7 = 18,  d7 = 19,  e7 = 20,  f7 = 21,  g7 = 22,  h7 = 23;
  const a6 = 32,   b6 = 33,   c6 = 34,  d6 = 35,  e6 = 36,  f6 = 37,  g6 = 39,  h6 = 40;
  const a5 = 48,   b5 = 49,   c5 = 50,  d5 = 51,  e5 = 52,  f5 = 53,  g5 = 54,  h5 = 55;
  const a4 = 64,   b4 = 65,   c4 = 66,  d4 = 67,  e4 = 68,  f4 = 69,  g4 = 70,  h4 = 71;
  const a3 = 80,   b3 = 81,   c3 = 82,  d3 = 83,  e3 = 84,  f3 = 85,  g3 = 86,  h3 = 87;
  const a2 = 96,   b2 = 97,   c2 = 98,  d2 = 99,  e2 = 100, f2 = 101, g2 = 102, h2 = 103;
  const a1 = 112,  b1 = 113,  c1 = 114, d1 = 115, e1 = 116, f1 = 117, g1 = 118, h1 = 119;
  
  // offboard empassant square
  const noEnpassant = 120;
  
  // array to convert board square indices to coordinates
  const coordinates = [
    'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8', 'i8', 'j8', 'k8', 'l8', 'm8', 'n8', 'o8', 'p8',
    'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7', 'i7', 'j7', 'k7', 'l7', 'm7', 'n7', 'o7', 'p7',
    'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6', 'i6', 'j6', 'k6', 'l6', 'm6', 'n6', 'o6', 'p6',
    'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5', 'i5', 'j5', 'k5', 'l5', 'm5', 'n5', 'o5', 'p5',
    'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4', 'i4', 'j4', 'k4', 'l4', 'm4', 'n4', 'o4', 'p4',
    'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3', 'i3', 'j3', 'k3', 'l3', 'm3', 'n3', 'o3', 'p3',
    'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2', 'i2', 'j2', 'k2', 'l2', 'm2', 'n2', 'o2', 'p2',
    'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1', 'i1', 'j1', 'k1', 'l1', 'm1', 'n1', 'o1', 'p1'
  ];


  /****************************\
   ============================
   
         BOARD DEFINITIONS

   ============================              
  \****************************/
  
  // 0x88 chess board representation
  var board = [
      r, n, b, q, k, b, n, r,  o, o, o, o, o, o, o, o,
      p, p, p, p, p, p, p, p,  o, o, o, o, o, o, o, o,
      e, e, e, e, e, e, e, e,  o, o, o, o, o, o, o, o,
      e, e, e, e, e, e, e, e,  o, o, o, o, o, o, o, o,
      e, e, e, e, e, e, e, e,  o, o, o, o, o, o, o, o,
      e, e, e, e, e, e, e, e,  o, o, o, o, o, o, o, o,
      P, P, P, P, P, P, P, P,  o, o, o, o, o, o, o, o,
      R, N, B, Q, K, B, N, R,  o, o, o, o, o, o, o, o
  ];
  
  // chess board state variables
  var side = white;
  var enpassant = noEnpassant;
  var castle = 15;
  var fifty = 0;
  var hashKey = 0;
  var kingSquare = [e1, e8];
  
  // board state variables backup stack
  var backup = [];
  

  /****************************\
   ============================
   
      RANDOM NUMBER GENERATOR

   ============================              
  \****************************/
  
  // fixed random seed
  var randomState = 1804289383;

  // generate 32-bit pseudo legal numbers
  function random() {
    var number = randomState;
    
    // 32-bit XOR shift
    number ^= number << 13;
    number ^= number >> 17;
    number ^= number << 5;
    randomState = number;

    return number;
  }


  /****************************\
   ============================
   
           ZOBRIST KEYS

   ============================              
  \****************************/ 
 
  // random keys
  var pieceKeys = new Array(13 * 128);
  var castleKeys = new Array(16);
  var sideKey;
  
  // init random hash keys
  function initRandomKeys() {
    for (var index = 0; index < 13 * 128; index++) pieceKeys[index] = random();
    for (var index = 0; index < 16; index++) castleKeys[index] = random();
    sideKey = random();
  }
  
  // generate hash key
  function generateHashKey() {
    var finalKey = 0;
    
    // hash board position
    for (var square = 0; square < 128; square++) {
      if ((square & 0x88) == 0)	{
        var piece = board[square];
        if (piece != e) finalKey ^= pieceKeys[(piece * 128) + square];
      }		
    }
    
    // hash board state variables
    if (side == white) finalKey ^= sideKey;
    if (enpassant != noEnpassant) finalKey ^= pieceKeys[enpassant];
    finalKey ^= castleKeys[castle];
    
    return finalKey;
  }


  /****************************\
   ============================
   
           BOARD METHODS

   ============================              
  \****************************/
  
  // reset chess board
  function resetBoard() {
    // reset board position
    for (var rank = 0; rank < 8; rank++) {
      for (var file = 0; file < 16; file++) {
        var square = rank * 16 + file;
        if ((square & 0x88) == 0) board[square] = e;
      }
    }
    
    // reset board state variables
    side = -1;
    enpassant = noEnpassant;
    castle = 0;
    fifty = 0;
    hashKey = 0;
    kingSquare = [0, 0];
  }

  
  /****************************\
   ============================
   
             ATTACKS

   ============================              
  \****************************/

  // square attacked
  function isSquareAttacked(square, side) {
    // by pawns
    for (let index = 0; index < 2; index++) {
      let targetSquare = square + pawnDirections.offsets[side][index] 
      if (((targetSquare) & 0x88) == 0 &&
           (board[targetSquare] == pawnDirections.pawn[side])) return 1;
    }
    
    // by leaper pieces
    for (let piece in leaperPieces) {      
      for (let index = 0; index < 8; index++) {
        let targetSquare = square + leaperPieces[piece].offsets[index];
        let targetPiece = board[targetSquare];
        if ((targetSquare & 0x88) == 0)
          if (targetPiece == leaperPieces[piece].side[side]) return 1;
      }
    }
    
    // by slider pieces
    for (let piece in sliderPieces) {
      for (let index = 0; index < 4; index++) {
        let targetSquare = square + sliderPieces[piece].offsets[index];
        while ((targetSquare & 0x88) == 0) {
          var targetPiece = board[targetSquare];
          if (sliderPieces[piece].side[side].includes(targetPiece)) return 1;
          if (targetPiece) break;
          targetSquare += sliderPieces[piece].offsets[index];
        }
      }
    }

    return 0;
  }


  /****************************\
   ============================
   
          MOVE ENCODING
 
   ============================              
  \****************************/
  
  // encode move
  function encodeMove(source, target, piece, capture, pawn, enpassant, castling) {
    return (source) |
           (target << 7) |
           (piece << 14) |
           (capture << 18) |
           (pawn << 19) |
           (enpassant << 20) |
           (castling << 21)
  }

  // decode move
  function getMoveSource(move) { return move & 0x7f }
  function getMoveTarget(move) { return (move >> 7) & 0x7f }
  function getMovePromoted(move) { return (move >> 14) & 0xf }
  function getMoveCapture(move) { return (move >> 18) & 0x1 }
  function getMovePawn(move) { return (move >> 19) & 0x1 }
  function getMoveEnpassant(move) { return (move >> 20) & 0x1 }
  function getMoveCastling(move) { return (move >> 21) & 0x1 }
  
  
  /****************************\
   ============================
   
          MOVE GENERATOR
 
   ============================              
  \****************************/
  
  // piece move offsets
  var knightOffsets = [33, 31, 18, 14, -33, -31, -18, -14];
  var bishopOffsets = [15, 17, -15, -17];
  var rookOffsets = [16, -16, 1, -1];
  var kingOffsets = [16, -16, 1, -1, 15, 17, -15, -17];
  
  // pawn directions to side mapping
  var pawnDirections = {
    offsets: [[17, 15], [-17, -15]],
    pawn: [P, p]
  }
  
  // leaper piece to offset mapping
  var leaperPieces = {
    knight: { offsets: knightOffsets, side: [N, n] },
    king: { offsets: kingOffsets, side: [K, k] }
  };
  
  // slider piece to offset mapping
  var sliderPieces = {
    bishop: { offsets: bishopOffsets, side: [[B, Q], [b, q]] },
    rook: { offsets: rookOffsets, side: [[R, Q], [r, q]] }
  };
  
  // pawn & castling mappings
  var specialMoves = {
    side: [
      {
        offset: [-17, -15],
        pawn: P,
        target: -16,
        doubleTarget: -32,
        capture: [7, 12],
        rank7: [a7, h7],
        rank2: [a2, h2],
        promoted: [Q, R, B, N],
        king: K,
        castling: [1, 2],
        empty: [f1, g1, d1, b1, c1],
        attacked: [e1, f1, d1],
        by: [black, white],
        castle: [e1, g1, c1]
      },
      {
        offset: [17, 15],
        pawn: p,
        target: 16,
        doubleTarget: 32,
        capture: [1, 6],
        rank7: [a2, h2],
        rank2: [a7, h7],
        promoted: [q, r, b, n],
        king: k,
        castling: [4, 8],
        empty: [f8, g8, d8, b8, c8],
        attacked: [e8, f8, d8],
        by: [black, white],
        castle: [e8, g8, c8]
      }
    ]
  }
  
  // castling rights
  var castlingRights = [
     7, 15, 15, 15,  3, 15, 15, 11,  o, o, o, o, o, o, o, o,
    15, 15, 15, 15, 15, 15, 15, 15,  o, o, o, o, o, o, o, o,
    15, 15, 15, 15, 15, 15, 15, 15,  o, o, o, o, o, o, o, o,
    15, 15, 15, 15, 15, 15, 15, 15,  o, o, o, o, o, o, o, o,
    15, 15, 15, 15, 15, 15, 15, 15,  o, o, o, o, o, o, o, o,
    15, 15, 15, 15, 15, 15, 15, 15,  o, o, o, o, o, o, o, o,
    15, 15, 15, 15, 15, 15, 15, 15,  o, o, o, o, o, o, o, o,
    13, 15, 15, 15, 12, 15, 15, 14,  o, o, o, o, o, o, o, o
  ];

  // populate move list
  function addMove(moveList, move) {
    moveList.push({
      move: move,
      score: 0
    });
  }

  // move generator
  function generateMoves(moveList) {
    for (let sourceSquare = 0; sourceSquare < 128; sourceSquare++) {
      // pawns
      if ((sourceSquare & 0x88) == 0) {
        if (board[sourceSquare] == specialMoves.side[side].pawn) {
          let targetSquare = sourceSquare + specialMoves.side[side].target;
          
          // quiet moves
          if ((targetSquare & 0x88) == 0 && board[targetSquare] == e) {   
            if (sourceSquare >= specialMoves.side[side].rank7[0] &&
                sourceSquare <= specialMoves.side[side].rank7[1]) {
              for (let promotedIndex = 0; promotedIndex < 4; promotedIndex++) {
                let promotedPiece = specialMoves.side[side].promoted[promotedIndex];
                addMove(moveList, encodeMove(sourceSquare, targetSquare, promotedPiece, 0, 0, 0, 0));
              }
            } else {
              addMove(moveList, encodeMove(sourceSquare, targetSquare, 0, 0, 0, 0, 0));
              let doubleTarget = sourceSquare + specialMoves.side[side].doubleTarget;
              
              if ((sourceSquare >= specialMoves.side[side].rank2[0] &&
                   sourceSquare <= specialMoves.side[side].rank2[1]) &&
                   board[doubleTarget] == e)
                addMove(moveList, encodeMove(sourceSquare, doubleTarget, 0, 0, 1, 0, 0));
            }
          }
          
          // captures
          for (let index = 0; index < 2; index++) {
            let pawn_offset = specialMoves.side[side].offset[index];
            let targetSquare = sourceSquare + pawn_offset;
            
            if ((targetSquare & 0x88) == 0) {
              if ((sourceSquare >= specialMoves.side[side].rank7[0] &&
                   sourceSquare <= specialMoves.side[side].rank7[1]) &&
                  (board[targetSquare] >= specialMoves.side[side].capture[0] &&
                   board[targetSquare] <= specialMoves.side[side].capture[1])
                 ) {
                for (let promotedIndex = 0; promotedIndex < 4; promotedIndex++) {
                  let promotedPiece = specialMoves.side[side].promoted[promotedIndex];
                  addMove(moveList, encodeMove(sourceSquare, targetSquare, promotedPiece, 1, 0, 0, 0));
                }
              } else {
                if (board[targetSquare] >= specialMoves.side[side].capture[0] &&
                    board[targetSquare] <= specialMoves.side[side].capture[1])
                  addMove(moveList, encodeMove(sourceSquare, targetSquare, 0, 1, 0, 0, 0));
                if (targetSquare == enpassant)
                  addMove(moveList, encodeMove(sourceSquare, targetSquare, 0, 1, 0, 1, 0));
              }
            }
          }
        }

        // castling
        else if (board[sourceSquare] == specialMoves.side[side].king) {
          if (castle & specialMoves.side[side].castling[0]) {
            if (board[specialMoves.side[side].empty[0]] == e &&
                board[specialMoves.side[side].empty[1]] == e) {
              if (isSquareAttacked(specialMoves.side[side].attacked[1], specialMoves.side[side].by[side]) == 0 &&
                  isSquareAttacked(specialMoves.side[side].attacked[0], specialMoves.side[side].by[side]) == 0)
                  addMove(moveList, encodeMove(specialMoves.side[side].castle[0], specialMoves.side[side].castle[1], 0, 0, 0, 0, 1));
            }
          }
          if (castle & specialMoves.side[side].castling[1]) {
            if (board[specialMoves.side[side].empty[2]] == e &&
                board[specialMoves.side[side].empty[3]] == e &&
                board[specialMoves.side[side].empty[4]] == e) {
              if (isSquareAttacked(specialMoves.side[side].attacked[2], specialMoves.side[side].by[side]) == 0 &&
                  isSquareAttacked(specialMoves.side[side].attacked[0], specialMoves.side[side].by[side]) == 0)
                  addMove(moveList, encodeMove(specialMoves.side[side].castle[0], specialMoves.side[side].castle[2], 0, 0, 0, 0, 1));
            }
          }
        }
        
        // leaper pieces
        for (let piece in leaperPieces) {
          if (board[sourceSquare] == leaperPieces[piece].side[side]) {
            for (let index = 0; index < 8; index++) {
              let targetSquare = sourceSquare + leaperPieces[piece].offsets[index];
              let capturedPiece = board[targetSquare];
              
              if ((targetSquare & 0x88) == 0) {
                if ((side == white) ? 
                    (capturedPiece == e || (capturedPiece >= 7 && capturedPiece <= 12)) : 
                    (capturedPiece == e || (capturedPiece >= 1 && capturedPiece <= 6))
                   ) {
                  if (capturedPiece) addMove(moveList, encodeMove(sourceSquare, targetSquare, 0, 1, 0, 0, 0));
                  else addMove(moveList, encodeMove(sourceSquare, targetSquare, 0, 0, 0, 0, 0));
                }
              }
            }
          }
        }
        
        // slider pieces
        for (let piece in sliderPieces) {
          if (board[sourceSquare] == sliderPieces[piece].side[side][0] ||
              board[sourceSquare] == sliderPieces[piece].side[side][1]) {
            for (var index = 0; index < 4; index++) {
              let targetSquare = sourceSquare + sliderPieces[piece].offsets[index];
              while (!(targetSquare & 0x88)) {
                var capturedPiece = board[targetSquare];
                
                if ((side == white) ? (capturedPiece >= 1 && capturedPiece <= 6) : ((capturedPiece >= 7 && capturedPiece <= 12))) break;
                if ((side == white) ? (capturedPiece >= 7 && capturedPiece <= 12) : ((capturedPiece >= 1 && capturedPiece <= 6))) {
                  addMove(moveList, encodeMove(sourceSquare, targetSquare, 0, 1, 0, 0, 0));
                  break;
                }
                
                if (capturedPiece == e) addMove(moveList, encodeMove(sourceSquare, targetSquare, 0, 0, 0, 0, 0));
                targetSquare += sliderPieces[piece].offsets[index];
              }
            }
          }
        }
      }
    }
  }

  // move piece on chess board
  function moveCurrentPiece(piece, sourceSquare, targetSquare) {
    board[targetSquare] = board[sourceSquare];
    board[sourceSquare] = e;
    hashKey ^= pieceKeys[piece * 128 + sourceSquare];
    hashKey ^= pieceKeys[piece * 128 + targetSquare];
  }

  // make move
  function makeMove(move) {
    // parse move
    let sourceSquare = getMoveSource(move);
    let targetSquare = getMoveTarget(move);
    let promotedPiece = getMovePromoted(move);
    let capturedPiece = board[targetSquare];
    
    // backup board state variables
    backup.push({
      move: move,
      capturedPiece: 0,
      side: side,
      enpassant: enpassant,
      castle: castle,
      fifty: fifty,
      hash: hashKey,
    });
    
    // move piece
    moveCurrentPiece(board[sourceSquare], sourceSquare, targetSquare);
    
    // update 50 move rule
    fifty++;

    // handle capture
    if (getMoveCapture(move)) {
      if (capturedPiece) {
        backup[backup.length - 1].capturedPiece = capturedPiece;
        hashKey ^= pieceKeys[capturedPiece * 128 + targetSquare];
      }
      fifty = 0;
    } else if (board[sourceSquare] == P || board[sourceSquare] == p)
      fifty = 0;
    
    // update enpassant square
    if (enpassant != noEnpassant) hashKey ^= pieceKeys[enpassant];
    enpassant = noEnpassant;
    
    // handle special moves
    if (getMovePawn(move)) {
      if (side == white) {
        enpassant = targetSquare + 16;
        hashKey ^= pieceKeys[targetSquare + 16];
      } else {
        enpassant = targetSquare - 16;
        hashKey ^= pieceKeys[targetSquare - 16];
      }
    } else if (getMoveEnpassant(move)) {
      if (side == white) {
        board[targetSquare + 16] = e;
        hashKey ^= pieceKeys[p * 128 + targetSquare + 16];
      } else {
        board[targetSquare - 16] = e;
        hashKey ^= pieceKeys[(P * 128) + (targetSquare - 16)];
      }
    } else if (getMoveCastling(move)) {
      switch(targetSquare) {
        case g1: moveCurrentPiece(R, h1, f1); break;
        case c1: moveCurrentPiece(R, a1, d1); break;
        case g8: moveCurrentPiece(r, h8, f8); break;
        case c8: moveCurrentPiece(r, a8, d8); break;
      }
    } else if (promotedPiece) {
      if (side == white) hashKey ^= pieceKeys[P * 128 + targetSquare];
      else hashKey ^= pieceKeys[p * 128 + targetSquare];
      board[targetSquare] = promotedPiece;
      hashKey ^= pieceKeys[promotedPiece * 128 + targetSquare];
    }
    
    // update king square
    if (board[targetSquare] == K || board[targetSquare] == k) kingSquare[side] = targetSquare;
    
    // update castling rights
    hashKey ^= castleKeys[castle];
    castle &= castlingRights[sourceSquare];
    castle &= castlingRights[targetSquare];
    hashKey ^= castleKeys[castle];
    
    // switch side to move
    side ^= 1;
    hashKey ^= sideKey;
    
    // return illegal move if king is left in check 
    if (isSquareAttacked((side == white) ? kingSquare[side ^ 1] : kingSquare[side ^ 1], side)) {
      takeBack();
      return 0;
    } else return 1;
  }
  
  // take move back
  function takeBack() {
    // parse move
    let moveIndex = backup.length - 1;
    let move = backup[moveIndex].move;    
    let sourceSquare = getMoveSource(move);
    let targetSquare = getMoveTarget(move);
    
    // move piece
    moveCurrentPiece(board[targetSquare], targetSquare, sourceSquare);
    
    // restore captured piece
    if (getMoveCapture(move)) board[targetSquare] = backup[moveIndex].capturedPiece;
    
    // handle special moves
    if (getMoveEnpassant(move)) {
      if (side == white) board[targetSquare - 16] = P;
      else board[targetSquare + 16] = p;
    } else if (getMoveCastling(move)) {
      switch(targetSquare) {
        case g1: moveCurrentPiece(R, f1, h1); break;
        case c1: moveCurrentPiece(R, d1, a1); break;
        case g8: moveCurrentPiece(r, f8, h8); break;
        case c8: moveCurrentPiece(r, d8, a8); break;
      }
    } else if (getMovePromoted(move))
      (side == white) ? board[sourceSquare] = p: board[sourceSquare] = P;
    
    // update king square
    if (board[sourceSquare] == K || board[sourceSquare] == k) kingSquare[side ^ 1] = sourceSquare;
    
    // switch side to move
    side = backup[moveIndex].side;
    
    // restore board state variables
    enpassant = backup[moveIndex].enpassant;
    castle = backup[moveIndex].castle;
    hashKey = backup[moveIndex].hash;
    fifty = backup[moveIndex].fifty;

    backup.pop();
  }


  /****************************\
   ============================
   
          INPUT & OUTPUT

   ============================              
  \****************************/
  
  // castling bits
  var KC = 1, QC = 2, kc = 4, qc = 8;

  // decode promoted pieces
  var promotedPieces = {
    [Q]: 'q', [R]: 'r', [B]: 'b', [N]: 'n',
    [q]: 'q', [r]: 'r', [b]: 'b', [n]: 'n'
  };

  // encode ascii pieces
  var charPieces = {
      'P': P, 'N': N, 'B': B, 'R': R, 'Q': Q, 'K': K,
      'p': p, 'n': n, 'b': b, 'r': r, 'q': q, 'k': k,
  };
  
  // unicode piece representation
  const unicodePieces = [
    '.', '\u2659', '\u2658', '\u2657', '\u2656', '\u2655', '\u2654',
         '\u265F', '\u265E', '\u265D', '\u265C', '\u265B', '\u265A'
  ];

  // set board position from FEN
  function setBoard(fen) {
    resetBoard();
    var index = 0;
    
    // parse board position
    for (var rank = 0; rank < 8; rank++) {
      for (var file = 0; file < 16; file++) {
        var square = rank * 16 + file;
        if ((square & 0x88) == 0) {
          if ((fen[index].charCodeAt() >= 'a'.charCodeAt() &&
               fen[index].charCodeAt() <= 'z'.charCodeAt()) || 
              (fen[index].charCodeAt() >= 'A'.charCodeAt() &&
               fen[index].charCodeAt() <= 'Z'.charCodeAt())) {
            if (fen[index] == 'K') kingSquare[white] = square;
            else if (fen[index] == 'k') kingSquare[black] = square;
            board[square] = charPieces[fen[index]];
            index++;
          }
          if (fen[index].charCodeAt() >= '0'.charCodeAt() &&
              fen[index].charCodeAt() <= '9'.charCodeAt()) {
            var offset = fen[index] - '0';
            if (!(board[square])) file--;
            file += offset;
            index++;
          }
          if (fen[index] == '/') index++;
        }
      }
    }
    
    // parse side to move
    index++;
    side = (fen[index] == 'w') ? white : black;
    index += 2;
    
    // parse castling rights
    while (fen[index] != ' ') {
      switch(fen[index]) {
        case 'K': castle |= KC; break;
        case 'Q': castle |= QC; break;
        case 'k': castle |= kc; break;
        case 'q': castle |= qc; break;
        case '-': break;
      }

      index++;
    }
    
    index++;
    
    // parse enpassant square
    if (fen[index] != '-') {
      var file = fen[index].charCodeAt() - 'a'.charCodeAt();
      var rank = 8 - (fen[index + 1].charCodeAt() - '0'.charCodeAt());
      enpassant = rank * 16 + file;
    } else enpassant = noEnpassant;
    
    // parse 50 rule move counter
    fifty = Number(fen.slice(index, fen.length - 1).split(' ')[1]);
    
    // generate unique position identifier
    hashKey = generateHashKey();
    
    // render board in browser
    if (typeof(document) != 'undefined') updateBoard();
  }
  
  // print chess board to console
  function printBoard() {
    var boardString = '';
    
    // print board position
    for (var rank = 0; rank < 8; rank++) {
      for (var file = 0; file < 16; file++) {
        var square = rank * 16 + file;
        if (file == 0) boardString += '   ' + (8 - rank).toString() + ' ';
        if ((square & 0x88) == 0) boardString += unicodePieces[board[square]] + ' ';
      }
      boardString += '\n'
    }
    
    boardString += '     a b c d e f g h';
    
    // print board state variables
    boardString += '\n\n     Side:     ' + ((side == 0) ? 'white': 'black');
    boardString += '\n     Castling:  ' + ((castle & KC) ? 'K' : '-') + 
                                        ((castle & QC) ? 'Q' : '-') +
                                        ((castle & kc) ? 'k' : '-') +
                                        ((castle & qc) ? 'q' : '-');
    boardString += '\n     Ep:          ' + ((enpassant == noEnpassant) ? 'no': coordinates[enpassant]);
    boardString += '\n\n     50 moves:    ' + fifty; 
    boardString += '\n     Key: ' + hashKey;
    console.log(boardString + '\n');
  }
  
  // print move
  function moveToString(move) {
    if (getMovePromoted(move)) {
      return coordinates[getMoveSource(move)] +
             coordinates[getMoveTarget(move)] +
             promotedPieces[getMovePromoted(move)];
    } else {
      return coordinates[getMoveSource(move)] +
             coordinates[getMoveTarget(move)];
    }
  }
	
  // print move list
  function printMoveList(moveList) {
    var listMoves = '   Move     Capture  Double   Enpass   Castling\n\n';
    
    for (var index = 0; index < moveList.length; index++) {
      var move = moveList[index].move;
      listMoves += '   ' + coordinates[getMoveSource(move)] + coordinates[getMoveTarget(move)];
      listMoves += (getMovePromoted(move) ? promotedPieces[getMovePromoted(move)] : ' ');
      listMoves += '    ' + getMoveCapture(move) +
                    '        ' + getMovePawn(move) +
                    '        ' + getMoveEnpassant(move) +
                    '        ' + getMoveCastling(move) + '\n';
    }
    
    listMoves += '\n   Total moves: ' + moveList.length;
    console.log(listMoves);
  }
  
  
  /****************************\
   ============================
   
              PERFT

   ============================              
  \****************************/

  // visited nodes count
  var nodes = 0;
  
  // perft driver
  function perftDriver(depth) {
    if  (depth == 0) { nodes++; return; }
    
    let moveList = [];
    generateMoves(moveList);
    
    for (var moveCount = 0; moveCount < moveList.length; moveCount++) {      
      if (!makeMove(moveList[moveCount].move)) continue;
      perftDriver(depth - 1);
      takeBack();
    }
  }

  // perft test
  function perftTest(depth) {
    console.log('   Performance test:\n');
    resultString = '';
    let startTime = new Date().getTime();
    
    let moveList = [];
    generateMoves(moveList);
    
    for (var moveCount = 0; moveCount < moveList.length; moveCount++) {      
      if (!makeMove(moveList[moveCount].move)) continue;
      let cumNodes = nodes;
      perftDriver(depth - 1);
      takeBack();
      let oldNodes = nodes - cumNodes;
      console.log(  '   move' +
                    ' ' + (moveCount + 1) + ((moveCount < 9) ? ':  ': ': ') +
                    coordinates[getMoveSource(moveList[moveCount].move)] +
                    coordinates[getMoveTarget(moveList[moveCount].move)] +
                    (getMovePromoted(moveList[moveCount].move) ?
                    promotedPieces[getMovePromoted(moveList[moveCount].move)]: ' ') +
                    '    nodes: ' + oldNodes);
    }
    
    resultString += '\n   Depth: ' + depth;
    resultString += '\n   Nodes: ' + nodes;
    resultString += '\n    Time: ' + (new Date().getTime() - startTime) + ' ms\n';
    console.log(resultString);
  }


  /****************************\
   ============================
   
               GUI

   ============================              
  \****************************/
  
  // browser mode [TODO: fix inbalanced tags in firefox]
  if (typeof(document) != 'undefined') { 
    // GUI appearance
    var LIGHT_SQUARE = '#f0d9b5';
    var DARK_SQUARE = '#b58863';
    var SELECT_COLOR = 'brown';
    var CELL_WIDTH = 50;
    var CELL_HEIGHT = 50;
    var clickLock = 0;
    var userSource, userTarget;
    if (boardSize) { CELL_WIDTH = boardSize / 8; CELL_HEIGHT = boardSize / 8; }
    if (lightSquare) LIGHT_SQUARE = lightSquare;
    if (darkSquare) DARK_SQUARE = darkSquare;
    if (selectColor) SELECT_COLOR = selectColor;
      
    // render board in browser
    function drawBoard() {      
      var chessBoard = '<table align="center" cellspacing="0" style="border: 1px solid black">';
      
      // generate board <table> tag
      for (var row = 0; row < 8; row++) {
        chessBoard += '<tr>'
        for (var col = 0; col < 16; col++) {
          var square = row * 16 + col;
          if ((square & 0x88) == 0)
            chessBoard += 
              '<td align="center" id="' + square + 
              '"bgcolor="' + ( ((col + row) % 2) ? DARK_SQUARE : LIGHT_SQUARE) + 
              '" width="' + CELL_WIDTH + 'px" height="' + CELL_HEIGHT +  'px" ' +
              ' onclick="engine.makeMove(this.id)" ' + 
              'ondragstart="engine.dragPiece(event, this.id)" ' +
              'ondragover="engine.dragOver(event, this.id)"'+
              'ondrop="engine.dropPiece(event, this.id)"' +
              '></td>'
        }

        chessBoard += '</tr>'
      }

      chessBoard += '</table>';
      document.getElementById('chessboard').innerHTML = chessBoard;
    }

    // draw pieces
    function updateBoard() {
      for (var row = 0; row < 8; row++) {
        for (var col = 0; col < 16; col++) {
          var square = row * 16 + col;
          if ((square & 0x88) == 0)
            document.getElementById(square).innerHTML = 
              '<img style="width: ' + 
               (boardSize ? boardSize / 8: 400 / 8) + 
              'px" draggable="true" id="' + 
               board[square] + '" src ="Images/' + 
              (board[square]) +'.gif">';
        }
      }
    }
    
    // pick piece handler
    function dragPiece(event, square) { userSource = square; }
    
    // drag piece handler
    function dragOver(event, square) { event.preventDefault();
      if (square == userSource) event.target.src = 'Images/0.gif';
    }
    
    // drop piece handler
    function dropPiece(event, square) {
      userTarget = square;
      movePiece(square);    
      if (board[square]) document.getElementById(square).style.backgroundColor = SELECT_COLOR;
      event.preventDefault();
    }
    
    // click event handler
    function tapPiece(square) {
      drawBoard();
      updateBoard();
      
      if (board[square]) document.getElementById(square).style.backgroundColor = SELECT_COLOR;
      var clickSquare = parseInt(square, 10)
      
      if(!clickLock && board[clickSquare]) {      
        userSource = clickSquare;
        clickLock ^= 1;
      } else if(clickLock) {      
        userTarget = clickSquare;
        movePiece(square);
      }
    }
    
    function movePiece(square) {
      var promotedPiece = Q; // [TODO: pick promoted from GUI]
      var move_str = coordinates[userSource] + 
                     coordinates[userTarget] + 
                     promotedPieces[promotedPiece];
      
      // move to make
      /*var valid_move  = is_valid(move_str);
      
      // if move is valid
      if (valid_move) {
        // push first move into move stack
        if (move_stack.count == 0) push_move(valid_move);
        
        // make move on internal board
        makeMove(valid_move, all_moves);
        
        // push move into move stack
        pushMove(valid_move);
        
        // update board
        updateBoard();
      }*/
      
      board[userTarget] = board[userSource];
      board[userSource] = e;
      drawBoard();
      if (board[userTarget]) document.getElementById(userTarget).style.backgroundColor = SELECT_COLOR;
      updateBoard();
      clickLock = 0;
    }
    drawBoard();
    updateBoard();
  }

  /****************************\
   ============================
   
               INIT

   ============================              
  \****************************/
  
  // init all when Chess() object is created
  (function init_all() {
    initRandomKeys();
    hashKey = generateHashKey();
  }())


  /****************************\
   ============================
   
              TESTS

   ============================              
  \****************************/
  
  function debug() {
    // parse position from FEN string
    //setBoard('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 ');
    setBoard('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1 ');
    //setBoard('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - -');
    //setBoard('rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8');
    printBoard();
    
    
    //moveList = [];
    //generateMoves(moveList);
    //printMoveList(moveList);
    
    // perft test
    perftTest(4);
    
    
    
    //  VICE in C  tricky depth 4:    1575
    //  VICE in JS tricky depth 4:    2224
    // Wukong in C tricky depth 4:    1400
  }
  
  return {

    /****************************\
     ============================
   
            GUI EVENT BINDS

     ============================              
    \****************************/
    
    // move piece on chess board
    makeMove: function(square) { tapPiece(square); },
    
    // event handlers
    dragPiece: function(event, square) { dragPiece(event, square); },
    dragOver: function(event, square) { dragOver(event, square); },
    dropPiece: function(event, square) { dropPiece(event, square); },  
  
    /****************************\
     ============================
   
          PUBLIC API REFERENCE

     ============================              
    \****************************/
    
    debug: function() { debug(); }
  }
}

if (typeof(document) != 'undefined') {

  /****************************\
   ============================

         WEB BROWSER MODE

   ============================              
  \****************************/
  
  // run in browser mode  
  console.log('\n  Wukong JS - CHESS ENGINE - v' + VERSION + '\n\n');
  
  // create basic HTML structure
  var html = '<html><head><title>Wukong JS v' + VERSION +
             '</title></head>' +
             '<h4 style="text-align: center; position: relative; top: 10px;">' +
             'Wukong JS - CHESS ENGINE - v' + VERSION +
             '</h4><body><div id="chessboard"></div></body></html>';
  
  // render HTML
  document.write(html);
  
  // init engine
  var engine = new Engine();
  engine.debug();

} else if (typeof(exports) != 'undefined') {

  /****************************\
   ============================

             UCI MODE

   ============================              
  \****************************/

  // run in UCI mode  
  console.log('\n  Wukong JS - CHESS ENGINE - v' + VERSION + '\n\n');
  
  // init engine
  var engine = new Engine();
  engine.debug();

}






