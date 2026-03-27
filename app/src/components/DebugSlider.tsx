import styled from "styled-components";
import { useTeamStore } from "../store/teamStore";

export default function DebugSlider() {
  const fieldMaxWidthPx = useTeamStore((state) => state.fieldMaxWidthPx);
  const setFieldMaxWidthPx = useTeamStore((state) => state.setFieldMaxWidthPx);
  const viewXOffset = useTeamStore((state) => state.viewXOffset);
  const setViewXOffset = useTeamStore((state) => state.setViewXOffset);

  return (
    <Container>
      <SliderGroup>
        <Label>Max Pitch Width (px)</Label>
        <Input
          type="range"
          min={400}
          max={2400}
          step={50}
          value={fieldMaxWidthPx}
          onChange={(e) => setFieldMaxWidthPx(Number(e.target.value))}
        />
        <Value>{fieldMaxWidthPx}px</Value>
      </SliderGroup>

      <SliderGroup>
        <Label>Camera X Offset</Label>
        <Input
          type="range"
          min={-100}
          max={100}
          step={1}
          value={viewXOffset}
          onChange={(e) => setViewXOffset(Number(e.target.value))}
        />
        <Value>{viewXOffset} units</Value>
      </SliderGroup>
    </Container>
  );
}

const Container = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  padding: 12px 16px;
  border-radius: 12px;
  color: white;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  width: 220px;
`;

const SliderGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.8;
`;

const Input = styled.input`
  width: 100%;
  cursor: pointer;
`;

const Value = styled.div`
  font-size: 14px;
  font-family: monospace;
  text-align: right;
  opacity: 0.9;
`;
