import { layout } from "../brand/layout";

// Positions children inside the Instagram-safe area, horizontally centered on the frame.
export const SafeArea: React.FC<{
  children: React.ReactNode;
  justify?: React.CSSProperties["justifyContent"];
}> = ({ children, justify = "flex-start" }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: layout.column.x,
        top: layout.content.y,
        width: layout.column.width,
        height: layout.content.height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: justify,
      }}
    >
      {children}
    </div>
  );
};
