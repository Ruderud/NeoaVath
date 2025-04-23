import { useRef, useEffect } from 'react';
import { createChart, ColorType, LineSeries } from 'lightweight-charts';

type ChartProps = {
  data: { time: string; value: number }[];
  width?: number;
  height?: number;
  colors?: {
    lineColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
  };
  title?: string;
};

export const Chart = ({
  data,
  width = 600,
  height = 300,
  colors = {
    lineColor: '#2962FF',
    areaTopColor: 'rgba(41, 98, 255, 0.56)',
    areaBottomColor: 'rgba(41, 98, 255, 0.04)',
  },
  title,
}: ChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartElement = chartContainerRef.current;
    console.log(chartElement);
    const chart = createChart(chartElement, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'white' },
        textColor: 'rgba(33, 56, 77, 1)',
      },
      grid: {
        vertLines: { color: 'rgba(197, 203, 206, 0.4)' },
        horzLines: { color: 'rgba(197, 203, 206, 0.4)' },
      },
      timeScale: {
        borderColor: 'rgba(197, 203, 206, 0.8)',
      },
      rightPriceScale: {
        borderColor: 'rgba(197, 203, 206, 0.8)',
      },
    });

    // 타이틀 추가
    // if (title) {
    //   chart.applyOptions({
    //   });
    // }

    // const areaSeries = chart.addSeries({
    //   defaultOptions: {
    //     ...defaultOptions.line,
    //     lineColor: colors.lineColor!,
    //     // topColor: colors.areaTopColor!,
    //     // bottomColor: colors.areaBottomColor!,
    //     // lineWidth: 2,
    //     // lineStyle: LineStyle.Solid,
    //   }
    // });

    const lineSeries = chart.addSeries(LineSeries);

    lineSeries.setData(data);

    // 차트 크기 조정
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: height,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // 차트 범위 자동 조정
    chart.timeScale().fitContent();

    // 클린업 함수
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, width, height, colors, title]);

  return <div ref={chartContainerRef} />;
};
