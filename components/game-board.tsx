import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';

export function GameBoard({ gameState, onMove, showHints, disabled }) {
  const { board, validMoves } = gameState;

  return (
    <View style={styles.boardContainer}>
      <View style={styles.board}>
        {board.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((cell, c) => {
              const isValid = validMoves.some((m) => m.r === r && m.c === c);
              const shouldShowHint = showHints && isValid;

              return (
                <Pressable
                  key={`${r}-${c}`}
                  style={styles.cell}
                  onPress={() => !disabled && isValid && onMove(r, c)}
                >
                  {cell !== 0 && (
                    <View
                      style={[
                        styles.piece,
                        cell === 1 ? styles.blackPiece : styles.whitePiece,
                      ]}
                    >
                      {cell === 1 && <View style={styles.metalShine} />}
                    </View>
                  )}

                  {cell === 0 && shouldShowHint && <View style={styles.hint} />}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  boardContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },

  board: {
    width: "100%",
    height: "100%",
    backgroundColor: "#0A3D2E",
    borderRadius: 8,
    overflow: "hidden",
  },

  row: {
    flex: 1,
    flexDirection: "row",
  },

  cell: {
    flex: 1,
    borderWidth: 0.8,
    borderColor: "rgba(20, 241, 149, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  piece: {
    width: "85%",
    height: "85%",
    borderRadius: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 10,
  },

  blackPiece: {
    backgroundColor: "#000",
    borderWidth: 2,
    borderColor: "#555",
    position: "relative",
    overflow: "hidden",
  },

  metalShine: {
    position: "absolute",
    top: "10%",
    left: "15%",
    width: "30%",
    height: "25%",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 20,
    transform: [{ rotate: "-15deg" }],
  },

  whitePiece: {
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#EEE",
  },

  hint: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(20, 241, 149, 0.6)",
  },
});