import styled from '@emotion/styled';

type PageTitleProps = {
  title: string;
};

export function PageTitle(props: PageTitleProps) {
  const { title } = props;

  return <Title>{title}</Title>;
}

const Title = styled.h1`
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
  grid-column: 1 / -1;
`;
