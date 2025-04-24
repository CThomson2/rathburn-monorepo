
import { motion } from "framer-motion";
import { OrderCard } from "./order-card";
import { Order } from "../types";
type AnimatedOrderCardProps = {
  order: Order;
  index: number;
}

export const AnimatedOrderCard = ({ order, index }: AnimatedOrderCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4,
        delay: index * 0.1,
        ease: "easeOut"
      }}
    >
      <OrderCard order={order} />
    </motion.div>
  );
};
